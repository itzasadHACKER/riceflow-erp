import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  DataImportDto,
  ImportTypeEnum,
  ImportFilterDto,
} from './dto/import.dto';

export interface ImportResult {
  success: boolean;
  row: number;
  error?: string;
}

@Injectable()
export class DataImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importData(
    organizationId: string,
    dto: DataImportDto,
    importedBy?: string,
  ) {
    if (!dto.rows || dto.rows.length === 0) {
      throw new BadRequestException('No data rows provided');
    }

    const importLog = await this.prisma.dataImportLog.create({
      data: {
        organizationId,
        importType: dto.importType,
        fileName: dto.fileName ?? 'manual-import',
        totalRows: dto.rows.length,
        status: 'PROCESSING',
        importedBy,
      },
    });

    const results: ImportResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < dto.rows.length; i++) {
      try {
        const row = dto.rows[i];
        await this.processRow(organizationId, dto.importType, row);
        results.push({ success: true, row: i + 1 });
        successCount++;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        results.push({ success: false, row: i + 1, error: errorMessage });
        failedCount++;
      }
    }

    const finalStatus =
      failedCount === 0
        ? 'COMPLETED_IMPORT'
        : successCount === 0
          ? 'FAILED_IMPORT'
          : 'PARTIALLY_COMPLETED';

    await this.prisma.dataImportLog.update({
      where: { id: importLog.id },
      data: {
        successRows: successCount,
        failedRows: failedCount,
        errors: results
          .filter((r) => !r.success)
          .map((r) => ({
            row: r.row,
            error: r.error,
          })),
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    return {
      importLogId: importLog.id,
      totalRows: dto.rows.length,
      successRows: successCount,
      failedRows: failedCount,
      status: finalStatus,
      errors: results.filter((r) => !r.success),
    };
  }

  private async processRow(
    organizationId: string,
    importType: ImportTypeEnum,
    row: Record<string, string>,
  ) {
    switch (importType) {
      case ImportTypeEnum.CUSTOMERS:
        return this.importCustomer(organizationId, row);
      case ImportTypeEnum.SUPPLIERS:
        return this.importSupplier(organizationId, row);
      case ImportTypeEnum.EMPLOYEES:
        return this.importEmployee(organizationId, row);
      case ImportTypeEnum.CHART_OF_ACCOUNTS:
        return this.importChartOfAccount(organizationId, row);
      case ImportTypeEnum.RICE_VARIETIES:
        return this.importRiceVariety(organizationId, row);
      case ImportTypeEnum.WAREHOUSES:
        return this.importWarehouse(organizationId, row);
      default:
        throw new BadRequestException(
          `Unsupported import type: ${importType as string}`,
        );
    }
  }

  private async importCustomer(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['name']) throw new Error('Name is required');
    await this.prisma.customer.create({
      data: {
        organizationId,
        name: row['name'],
        company: row['company'],
        phone: row['phone'],
        email: row['email'],
        address: row['address'],
        city: row['city'],
        customerType:
          (row['customerType'] as
            | 'DEALER'
            | 'RETAILER'
            | 'EXPORTER'
            | 'WHOLESALE'
            | 'WALK_IN') ?? 'DEALER',
        creditLimit: new Prisma.Decimal(row['creditLimit'] ?? '0'),
        openingBalance: new Prisma.Decimal(row['openingBalance'] ?? '0'),
        cnic: row['cnic'],
        ntn: row['ntn'],
      },
    });
  }

  private async importSupplier(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['name']) throw new Error('Name is required');
    await this.prisma.supplier.create({
      data: {
        organizationId,
        name: row['name'],
        company: row['company'],
        phone: row['phone'],
        email: row['email'],
        address: row['address'],
        city: row['city'],
        supplierType:
          (row['supplierType'] as
            | 'FARMER'
            | 'DEALER'
            | 'COMMISSION_AGENT'
            | 'ARTHI') ?? 'FARMER',
        creditLimit: new Prisma.Decimal(row['creditLimit'] ?? '0'),
        openingBalance: new Prisma.Decimal(row['openingBalance'] ?? '0'),
        cnic: row['cnic'],
        ntn: row['ntn'],
      },
    });
  }

  private async importEmployee(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['firstName'] || !row['lastName'])
      throw new Error('First name and last name are required');
    const count = await this.prisma.employee.count({
      where: { organizationId },
    });
    const employeeCode = `EMP-${String(count + 1).padStart(6, '0')}`;
    await this.prisma.employee.create({
      data: {
        organizationId,
        employeeCode,
        firstName: row['firstName'],
        lastName: row['lastName'],
        email: row['email'],
        phone: row['phone'],
        cnic: row['cnic'],
        joinDate: row['joinDate'] ? new Date(row['joinDate']) : new Date(),
        designation: row['designation'] ?? 'Staff',
        baseSalary: new Prisma.Decimal(row['baseSalary'] ?? '0'),
      },
    });
  }

  private async importChartOfAccount(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['code'] || !row['name'] || !row['accountType'])
      throw new Error('Code, name, and accountType are required');
    await this.prisma.chartOfAccount.create({
      data: {
        organizationId,
        code: row['code'],
        name: row['name'],
        accountType: row['accountType'] as
          | 'ASSET'
          | 'LIABILITY'
          | 'EQUITY'
          | 'INCOME'
          | 'EXPENSE',
        balanceType: row['balanceType'] === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        isGroup: row['isGroup'] === 'true',
        description: row['description'],
        openingBalance: new Prisma.Decimal(row['openingBalance'] ?? '0'),
      },
    });
  }

  private async importRiceVariety(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['name'] || !row['code'])
      throw new Error('Name and code are required');
    await this.prisma.riceVariety.create({
      data: {
        organizationId,
        name: row['name'],
        code: row['code'],
        riceType: row['riceType'] === 'RICE' ? 'RICE' : 'PADDY',
        category:
          (row['category'] as
            | 'BASMATI'
            | 'NON_BASMATI'
            | 'SELLA'
            | 'STEAM'
            | 'PARBOILED'
            | 'BROKEN'
            | 'OTHER') ?? 'BASMATI',
        defaultMoisture: row['defaultMoisture']
          ? new Prisma.Decimal(row['defaultMoisture'])
          : undefined,
        description: row['description'],
      },
    });
  }

  private async importWarehouse(
    organizationId: string,
    row: Record<string, string>,
  ) {
    if (!row['name'] || !row['code'])
      throw new Error('Name and code are required');
    await this.prisma.warehouse.create({
      data: {
        organizationId,
        name: row['name'],
        code: row['code'],
        address: row['address'],
        capacity: row['capacity']
          ? new Prisma.Decimal(row['capacity'])
          : undefined,
        capacityUnit: row['capacityUnit'] ?? 'TON',
      },
    });
  }

  async getImportLogs(organizationId: string, filter: ImportFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.DataImportLogWhereInput = { organizationId };
    if (filter.importType) where.importType = filter.importType;
    const [data, total] = await Promise.all([
      this.prisma.dataImportLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dataImportLog.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  getImportTemplate(importType: ImportTypeEnum) {
    const templates: Record<string, string[]> = {
      CUSTOMERS: [
        'name',
        'company',
        'phone',
        'email',
        'address',
        'city',
        'customerType',
        'creditLimit',
        'openingBalance',
        'cnic',
        'ntn',
      ],
      SUPPLIERS: [
        'name',
        'company',
        'phone',
        'email',
        'address',
        'city',
        'supplierType',
        'creditLimit',
        'openingBalance',
        'cnic',
        'ntn',
      ],
      EMPLOYEES: [
        'firstName',
        'lastName',
        'email',
        'phone',
        'cnic',
        'joinDate',
        'designation',
        'baseSalary',
      ],
      CHART_OF_ACCOUNTS: [
        'code',
        'name',
        'accountType',
        'balanceType',
        'isGroup',
        'description',
        'openingBalance',
      ],
      RICE_VARIETIES: [
        'name',
        'code',
        'riceType',
        'category',
        'defaultMoisture',
        'description',
      ],
      WAREHOUSES: ['name', 'code', 'address', 'capacity', 'capacityUnit'],
      INVENTORY_ITEMS: [
        'riceVarietyId',
        'warehouseId',
        'quantity',
        'unit',
        'lotNumber',
        'valuationRate',
      ],
    };
    return {
      importType,
      columns: templates[importType] ?? [],
    };
  }
}
