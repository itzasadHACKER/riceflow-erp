import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ExportRequestDto,
  ExportFormatEnum,
  ExportEntityEnum,
} from './dto/export.dto';

interface ExportRow {
  [key: string]: string | number | boolean | null;
}

@Injectable()
export class ExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportData(organizationId: string, dto: ExportRequestDto) {
    const rows = await this.fetchData(organizationId, dto);
    if (rows.length === 0) {
      throw new BadRequestException('No data found for export');
    }

    const columns =
      dto.columns && dto.columns.length > 0
        ? dto.columns
        : Object.keys(rows[0]);

    switch (dto.format) {
      case ExportFormatEnum.CSV:
        return this.generateCsv(rows, columns);
      case ExportFormatEnum.EXCEL:
        return this.generateExcelJson(rows, columns);
      case ExportFormatEnum.PDF:
        return this.generatePdfData(rows, columns, dto.entity);
      default:
        throw new BadRequestException('Unsupported format');
    }
  }

  private async fetchData(
    organizationId: string,
    dto: ExportRequestDto,
  ): Promise<ExportRow[]> {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dto.startDate) dateFilter.gte = new Date(dto.startDate);
    if (dto.endDate) dateFilter.lte = new Date(dto.endDate);
    const hasDateFilter = dto.startDate || dto.endDate;

    switch (dto.entity) {
      case ExportEntityEnum.JOURNAL_ENTRIES: {
        const entries = await this.prisma.journalEntry.findMany({
          where: {
            organizationId,
            deletedAt: null,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          include: { lines: { include: { account: true } } },
          orderBy: { date: 'desc' },
        });
        return entries.map((e) => ({
          entryNumber: e.entryNumber,
          date: e.date.toISOString().split('T')[0],
          narration: e.narration ?? '',
          reference: e.reference ?? '',
          entryType: e.entryType,
          isPosted: e.isPosted,
          totalDebit: e.lines
            .reduce((sum, l) => sum.add(l.debit), new Prisma.Decimal(0))
            .toString(),
          totalCredit: e.lines
            .reduce((sum, l) => sum.add(l.credit), new Prisma.Decimal(0))
            .toString(),
        }));
      }

      case ExportEntityEnum.CUSTOMERS: {
        const customers = await this.prisma.customer.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { name: 'asc' },
        });
        return customers.map((c) => ({
          name: c.name,
          company: c.company ?? '',
          phone: c.phone ?? '',
          email: c.email ?? '',
          city: c.city ?? '',
          customerType: c.customerType,
          creditLimit: c.creditLimit.toString(),
          openingBalance: c.openingBalance.toString(),
          isActive: c.isActive,
        }));
      }

      case ExportEntityEnum.SUPPLIERS: {
        const suppliers = await this.prisma.supplier.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { name: 'asc' },
        });
        return suppliers.map((s) => ({
          name: s.name,
          company: s.company ?? '',
          phone: s.phone ?? '',
          email: s.email ?? '',
          city: s.city ?? '',
          supplierType: s.supplierType,
          creditLimit: s.creditLimit.toString(),
          openingBalance: s.openingBalance.toString(),
          isActive: s.isActive,
        }));
      }

      case ExportEntityEnum.EMPLOYEES: {
        const employees = await this.prisma.employee.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { firstName: 'asc' },
        });
        return employees.map((e) => ({
          employeeCode: e.employeeCode,
          name: `${e.firstName} ${e.lastName}`,
          email: e.email ?? '',
          phone: e.phone ?? '',
          designation: e.designation ?? '',
          baseSalary: e.baseSalary.toString(),
          isActive: e.isActive,
        }));
      }

      case ExportEntityEnum.INVENTORY: {
        const items = await this.prisma.inventoryItem.findMany({
          where: { organizationId },
          include: { riceVariety: true, warehouse: true },
        });
        return items.map((i) => ({
          variety: i.riceVariety.name,
          warehouse: i.warehouse.name,
          quantity: i.quantity.toString(),
          unit: i.unit,
          valuationRate: i.valuationRate.toString(),
          totalValue: i.totalValue.toString(),
          lotNumber: i.lotNumber ?? '',
        }));
      }

      case ExportEntityEnum.SALES_INVOICES: {
        const invoices = await this.prisma.salesInvoice.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          include: { customer: true },
          orderBy: { date: 'desc' },
        });
        return invoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          date: inv.date.toISOString().split('T')[0],
          customer: inv.customer.name,
          totalAmount: inv.totalAmount.toString(),
          discount: inv.discount.toString(),
          taxAmount: inv.taxAmount.toString(),
          netAmount: inv.netAmount.toString(),
          paymentStatus: inv.paymentStatus,
        }));
      }

      case ExportEntityEnum.PURCHASE_ENTRIES: {
        const purchases = await this.prisma.paddyPurchase.findMany({
          where: {
            organizationId,
            deletedAt: null,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          include: { supplier: true, riceVariety: true },
          orderBy: { date: 'desc' },
        });
        return purchases.map((p) => ({
          purchaseNumber: p.purchaseNumber,
          date: p.date.toISOString().split('T')[0],
          supplier: p.supplier.name,
          variety: p.riceVariety.name,
          grossWeight: p.grossWeight.toString(),
          netWeight: p.netWeight.toString(),
          finalWeight: p.finalWeight.toString(),
          rate: p.ratePerUnit.toString(),
          netAmount: p.netAmount.toString(),
          paymentStatus: p.paymentStatus,
        }));
      }

      case ExportEntityEnum.PAYMENT_VOUCHERS: {
        const vouchers = await this.prisma.paymentVoucher.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          orderBy: { date: 'desc' },
        });
        return vouchers.map((v) => ({
          voucherNumber: v.voucherNumber,
          date: v.date.toISOString().split('T')[0],
          amount: v.amount.toString(),
          paymentMode: v.paymentMode,
          narration: v.narration ?? '',
          status: v.status,
        }));
      }

      case ExportEntityEnum.RECEIPT_VOUCHERS: {
        const vouchers = await this.prisma.receiptVoucher.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          orderBy: { date: 'desc' },
        });
        return vouchers.map((v) => ({
          voucherNumber: v.voucherNumber,
          date: v.date.toISOString().split('T')[0],
          amount: v.amount.toString(),
          paymentMode: v.paymentMode,
          narration: v.narration ?? '',
          status: v.status,
        }));
      }

      case ExportEntityEnum.ASSETS: {
        const assets = await this.prisma.fixedAsset.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
        });
        return assets.map((a) => ({
          assetCode: a.assetCode,
          name: a.name,
          category: a.category,
          purchaseDate: a.purchaseDate.toISOString().split('T')[0],
          purchasePrice: a.purchasePrice.toString(),
          currentValue: a.currentValue.toString(),
          accumulatedDepreciation: a.accumulatedDepr.toString(),
          status: a.status,
          depreciationMethod: a.depreciationMethod,
        }));
      }

      case ExportEntityEnum.QUALITY_INSPECTIONS: {
        const inspections = await this.prisma.qualityInspection.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          orderBy: { date: 'desc' },
        });
        return inspections.map((q) => ({
          inspectionNumber: q.inspectionNumber,
          date: q.date.toISOString().split('T')[0],
          referenceType: q.referenceType,
          moisture: q.moisture?.toString() ?? '',
          brokenPercentage: q.brokenPercentage?.toString() ?? '',
          grade: q.grade ?? '',
          status: q.status,
        }));
      }

      case ExportEntityEnum.EXPENSE_CLAIMS: {
        const claims = await this.prisma.expenseClaim.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { date: dateFilter } : {}),
          },
          orderBy: { date: 'desc' },
        });
        return claims.map((c) => ({
          claimNumber: c.claimNumber,
          date: c.date.toISOString().split('T')[0],
          description: c.description,
          totalAmount: c.totalAmount.toString(),
          status: c.status,
        }));
      }

      case ExportEntityEnum.STOCK_MOVEMENTS: {
        const movements = await this.prisma.stockMovement.findMany({
          where: {
            organizationId,
            ...(hasDateFilter ? { movementDate: dateFilter } : {}),
          },
          include: {
            sourceWarehouse: true,
            destinationWarehouse: true,
          },
          orderBy: { movementDate: 'desc' },
        });
        return movements.map((m) => ({
          date: m.movementDate.toISOString().split('T')[0],
          movementType: m.movementType,
          riceVarietyId: m.riceVarietyId ?? '',
          quantity: m.quantity.toString(),
          sourceWarehouse: m.sourceWarehouse?.name ?? '',
          destinationWarehouse: m.destinationWarehouse?.name ?? '',
        }));
      }

      default:
        throw new BadRequestException(
          `Unsupported entity: ${dto.entity as string}`,
        );
    }
  }

  private generateCsv(
    rows: ExportRow[],
    columns: string[],
  ): { content: string; contentType: string; fileName: string } {
    const header = columns.join(',');
    const dataLines = rows.map((row) =>
      columns
        .map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return '';
          const strVal = String(val);
          if (strVal.includes(',') || strVal.includes('"')) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        })
        .join(','),
    );
    return {
      content: [header, ...dataLines].join('\n'),
      contentType: 'text/csv',
      fileName: 'export.csv',
    };
  }

  private generateExcelJson(
    rows: ExportRow[],
    columns: string[],
  ): {
    headers: string[];
    data: (string | number | boolean | null)[][];
    contentType: string;
    fileName: string;
  } {
    const data = rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        return val ?? null;
      }),
    );
    return {
      headers: columns,
      data,
      contentType: 'application/json',
      fileName: 'export.xlsx',
    };
  }

  private generatePdfData(
    rows: ExportRow[],
    columns: string[],
    entity: ExportEntityEnum,
  ): {
    title: string;
    headers: string[];
    data: (string | number | boolean | null)[][];
    contentType: string;
    fileName: string;
  } {
    const titleMap: Record<string, string> = {
      JOURNAL_ENTRIES: 'Journal Entries Report',
      TRIAL_BALANCE: 'Trial Balance',
      PROFIT_LOSS: 'Profit & Loss Statement',
      BALANCE_SHEET: 'Balance Sheet',
      GENERAL_LEDGER: 'General Ledger',
      SALES_INVOICES: 'Sales Invoices',
      PURCHASE_ENTRIES: 'Purchase Entries',
      CUSTOMERS: 'Customer Master',
      SUPPLIERS: 'Supplier Master',
      EMPLOYEES: 'Employee Register',
      INVENTORY: 'Inventory Report',
      STOCK_MOVEMENTS: 'Stock Movements',
      EXPENSE_CLAIMS: 'Expense Claims',
      PAYMENT_VOUCHERS: 'Payment Vouchers',
      RECEIPT_VOUCHERS: 'Receipt Vouchers',
      ASSETS: 'Fixed Assets Register',
      QUALITY_INSPECTIONS: 'Quality Inspections',
    };

    const data = rows.map((row) =>
      columns.map((col) => {
        const val = row[col];
        return val ?? null;
      }),
    );

    return {
      title: titleMap[entity] ?? 'Report',
      headers: columns,
      data,
      contentType: 'application/json',
      fileName: 'export.pdf',
    };
  }

  // ===== PRINT TEMPLATES =====

  async getPrintTemplates(organizationId: string, entityType?: string) {
    const where: Prisma.PrintTemplateWhereInput = { organizationId };
    if (entityType) where.entityType = entityType;
    return this.prisma.printTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPrintTemplate(
    organizationId: string,
    data: {
      name: string;
      entityType: string;
      template: string;
      isDefault?: boolean;
      paperSize?: string;
      orientation?: string;
      headerHtml?: string;
      footerHtml?: string;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.printTemplate.updateMany({
        where: {
          organizationId,
          entityType: data.entityType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.printTemplate.create({
      data: {
        organizationId,
        name: data.name,
        entityType: data.entityType,
        template: data.template,
        isDefault: data.isDefault ?? false,
        paperSize: data.paperSize ?? 'A4',
        orientation: data.orientation ?? 'portrait',
        headerHtml: data.headerHtml,
        footerHtml: data.footerHtml,
      },
    });
  }

  // ===== NUMBERING SERIES =====

  async getNumberingSeries(organizationId: string) {
    return this.prisma.numberingSeries.findMany({
      where: { organizationId },
      orderBy: { entityType: 'asc' },
    });
  }

  async updateNumberingSeries(
    organizationId: string,
    entityType: string,
    data: { prefix?: string; padLength?: number; suffix?: string },
  ) {
    return this.prisma.numberingSeries.upsert({
      where: {
        organizationId_entityType: { organizationId, entityType },
      },
      create: {
        organizationId,
        entityType,
        prefix: data.prefix ?? entityType.substring(0, 3),
        padLength: data.padLength ?? 6,
        suffix: data.suffix,
      },
      update: {
        prefix: data.prefix,
        padLength: data.padLength,
        suffix: data.suffix,
      },
    });
  }
}
