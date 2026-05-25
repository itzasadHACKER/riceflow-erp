import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminEnhancedService {
  constructor(private prisma: PrismaService) {}

  // ─── User-Defined Fields (UDF) on existing entities ─────────
  async createUdf(orgId: string, dto: any) {
    return this.prisma.customField.create({
      data: {
        organizationId: orgId,
        entityType: dto.entityType,
        fieldName: dto.fieldName,
        fieldType: dto.fieldType,
        fieldLabel: dto.label || dto.fieldName,
        options: dto.options ? dto.options : Prisma.JsonNull,
        isRequired: dto.required || false,
        isActive: true,
      },
    });
  }

  async findUdfs(orgId: string, entityType?: string) {
    return this.prisma.customField.findMany({
      where: { organizationId: orgId, ...(entityType ? { entityType } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setUdfValue(orgId: string, dto: { customFieldId: string; entityId: string; entityType: string; value: string }) {
    return this.prisma.customFieldValue.upsert({
      where: { customFieldId_entityId: { customFieldId: dto.customFieldId, entityId: dto.entityId } },
      create: {
        organizationId: orgId,
        customFieldId: dto.customFieldId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        value: dto.value,
      },
      update: { value: dto.value },
    });
  }

  async getUdfValues(orgId: string, entityId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { entityId, organizationId: orgId },
    });
  }

  // ─── Print Layout Designer ──────────────────────────────────
  async createPrintLayout(orgId: string, dto: any) {
    if (dto.isDefault) {
      await this.prisma.printTemplate.updateMany({
        where: { organizationId: orgId, entityType: dto.documentType, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.printTemplate.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        entityType: dto.documentType,
        template: dto.layout,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findPrintLayouts(orgId: string, documentType?: string) {
    return this.prisma.printTemplate.findMany({
      where: { organizationId: orgId, ...(documentType ? { entityType: documentType } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePrintLayout(orgId: string, id: string, dto: any) {
    return this.prisma.printTemplate.update({
      where: { id },
      data: { name: dto.name, template: dto.layout, isDefault: dto.isDefault },
    });
  }

  // ─── Form Customization ────────────────────────────────────
  async saveFormLayout(orgId: string, dto: any) {
    const key = `form_layout_${dto.formName}${dto.roleId ? '_' + dto.roleId : ''}`;
    return this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      create: {
        organizationId: orgId,
        key,
        value: dto.layout as unknown as Prisma.InputJsonValue,
        category: 'FORM_CUSTOMIZATION',
      },
      update: { value: dto.layout as unknown as Prisma.InputJsonValue },
    });
  }

  async getFormLayout(orgId: string, formName: string, roleId?: string) {
    const key = `form_layout_${formName}${roleId ? '_' + roleId : ''}`;
    return this.prisma.systemSetting.findFirst({ where: { organizationId: orgId, key } });
  }

  async findFormCustomizations(orgId: string) {
    return this.prisma.systemSetting.findMany({
      where: { organizationId: orgId, category: 'FORM_CUSTOMIZATION' },
    });
  }

  // ─── Data Ownership ────────────────────────────────────────
  async setDataOwnership(orgId: string, dto: any) {
    const key = `data_ownership_${dto.entityType}_${dto.roleId}`;
    return this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      create: {
        organizationId: orgId,
        key,
        value: { accessLevel: dto.accessLevel } as unknown as Prisma.InputJsonValue,
        category: 'DATA_OWNERSHIP',
      },
      update: { value: { accessLevel: dto.accessLevel } as unknown as Prisma.InputJsonValue },
    });
  }

  async findDataOwnershipRules(orgId: string) {
    return this.prisma.systemSetting.findMany({
      where: { organizationId: orgId, category: 'DATA_OWNERSHIP' },
    });
  }

  // ─── Drag & Relate ──────────────────────────────────────────
  async dragAndRelate(orgId: string, entityType: string, entityId: string) {
    const result: Record<string, unknown[]> = {};

    if (entityType === 'CUSTOMER') {
      const [invoices, orders, returns, creditNotes, deliveryChallans] = await Promise.all([
        this.prisma.salesInvoice.findMany({ where: { organizationId: orgId, customerId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.salesOrder.findMany({ where: { organizationId: orgId, customerId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.salesReturn.findMany({ where: { organizationId: orgId, customerId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.creditNote.findMany({ where: { organizationId: orgId, customerId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.deliveryChallan.findMany({ where: { organizationId: orgId, customerId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
      ]);
      result.invoices = invoices;
      result.orders = orders;
      result.returns = returns;
      result.creditNotes = creditNotes;
      result.deliveryChallans = deliveryChallans;
    }

    if (entityType === 'SUPPLIER') {
      const [purchases, purchaseReturns, debitNotes] = await Promise.all([
        this.prisma.paddyPurchase.findMany({ where: { organizationId: orgId, supplierId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.purchaseReturn.findMany({ where: { organizationId: orgId, supplierId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.debitNote.findMany({ where: { organizationId: orgId, supplierId: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
      ]);
      result.purchases = purchases;
      result.purchaseReturns = purchaseReturns;
      result.debitNotes = debitNotes;
    }

    if (entityType === 'ITEM') {
      const [batches, serials] = await Promise.all([
        this.prisma.batchRecord.findMany({ where: { organizationId: orgId, itemCode: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.serialNumber.findMany({ where: { organizationId: orgId, itemCode: entityId }, take: 10, orderBy: { createdAt: 'desc' } }),
      ]);
      result.batches = batches;
      result.serials = serials;
    }

    if (entityType === 'ACCOUNT') {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: { accountId: entityId, journalEntry: { organizationId: orgId } },
        include: { journalEntry: { select: { entryNumber: true, date: true, narration: true, isPosted: true } } },
        take: 20,
        orderBy: { journalEntry: { date: 'desc' } },
      });
      result.journalLines = lines;
    }

    return { entityType, entityId, relatedData: result };
  }

  // ─── Excel Export ──────────────────────────────────────────
  async getExportData(orgId: string, module: string) {
    switch (module) {
      case 'customers':
        return { data: await this.prisma.customer.findMany({ where: { organizationId: orgId } }) };
      case 'suppliers':
        return { data: await this.prisma.supplier.findMany({ where: { organizationId: orgId } }) };
      case 'invoices':
        return { data: await this.prisma.salesInvoice.findMany({ where: { organizationId: orgId }, include: { customer: true } }) };
      case 'journal-entries':
        return { data: await this.prisma.journalEntry.findMany({ where: { organizationId: orgId }, include: { lines: { include: { account: true } } }, take: 500, orderBy: { date: 'desc' } }) };
      case 'chart-of-accounts':
        return { data: await this.prisma.chartOfAccount.findMany({ where: { organizationId: orgId }, orderBy: { code: 'asc' } }) };
      case 'inventory':
        return { data: await this.prisma.inventoryItem.findMany({ where: { organizationId: orgId }, include: { warehouse: true, riceVariety: true } }) };
      case 'employees':
        return { data: await this.prisma.employee.findMany({ where: { organizationId: orgId } }) };
      default:
        return { modules: ['customers', 'suppliers', 'invoices', 'journal-entries', 'chart-of-accounts', 'inventory', 'employees'] };
    }
  }

  // ─── Summary ────────────────────────────────────────────────
  async getAdminEnhancedSummary(orgId: string) {
    const [udfs, printLayouts, formCustomizations, dataOwnershipRules] = await Promise.all([
      this.prisma.customField.count({ where: { organizationId: orgId } }),
      this.prisma.printTemplate.count({ where: { organizationId: orgId } }),
      this.prisma.systemSetting.count({ where: { organizationId: orgId, category: 'FORM_CUSTOMIZATION' } }),
      this.prisma.systemSetting.count({ where: { organizationId: orgId, category: 'DATA_OWNERSHIP' } }),
    ]);
    return { udfs, printLayouts, formCustomizations, dataOwnershipRules };
  }
}
