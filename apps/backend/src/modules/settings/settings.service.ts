import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UpsertSettingDto, CreateNotificationDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== SYSTEM SETTINGS =====

  async upsertSetting(organizationId: string, dto: UpsertSettingDto) {
    return this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId, key: dto.key } },
      create: {
        organizationId,
        key: dto.key,
        value: dto.value as Prisma.InputJsonValue,
        category: dto.category,
      },
      update: {
        value: dto.value as Prisma.InputJsonValue,
        category: dto.category,
      },
    });
  }

  async getSetting(organizationId: string, key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { organizationId_key: { organizationId, key } },
    });
    if (!setting) throw new NotFoundException(`Setting '${key}' not found`);
    return setting;
  }

  async listSettings(organizationId: string, category?: string) {
    return this.prisma.systemSetting.findMany({
      where: {
        organizationId,
        ...(category ? { category } : {}),
      },
      orderBy: { key: 'asc' },
    });
  }

  async deleteSetting(organizationId: string, key: string) {
    await this.getSetting(organizationId, key);
    return this.prisma.systemSetting.delete({
      where: { organizationId_key: { organizationId, key } },
    });
  }

  async seedDefaultSettings(organizationId: string) {
    const defaults: Array<{
      key: string;
      value: Record<string, unknown>;
      category: string;
    }> = [
      {
        key: 'currency',
        value: { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
        category: 'general',
      },
      {
        key: 'weight_unit',
        value: { primary: 'KG', secondary: 'MAUND', conversion: 37.3242 },
        category: 'general',
      },
      {
        key: 'fiscal_year_start',
        value: { month: 7, day: 1 },
        category: 'finance',
      },
      {
        key: 'purchase_numbering',
        value: { prefix: 'PP-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'sales_order_numbering',
        value: { prefix: 'SO-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'invoice_numbering',
        value: { prefix: 'INV-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'challan_numbering',
        value: { prefix: 'DC-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'journal_numbering',
        value: { prefix: 'JE-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'payment_numbering',
        value: { prefix: 'PV-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'receipt_numbering',
        value: { prefix: 'RV-', padLength: 6, startFrom: 1 },
        category: 'numbering',
      },
      {
        key: 'moisture_standard',
        value: { maxAcceptable: 14, penaltyPerPercent: 0.5 },
        category: 'procurement',
      },
      {
        key: 'working_days',
        value: { perMonth: 26, weekOff: 'FRIDAY' },
        category: 'hr',
      },
      { key: 'overtime_rate', value: { multiplier: 1.5 }, category: 'hr' },
      {
        key: 'tax_settings',
        value: { defaultTaxRate: 17, withholdingTax: 4.5 },
        category: 'finance',
      },
      {
        key: 'invoice_terms',
        value: { defaultPaymentDays: 30, lateFeePercentage: 1.5 },
        category: 'sales',
      },
      {
        key: 'inventory_valuation',
        value: { method: 'WEIGHTED_AVERAGE' },
        category: 'inventory',
      },
    ];

    const results: Array<{ key: string; status: string }> = [];

    for (const setting of defaults) {
      const existing = await this.prisma.systemSetting.findUnique({
        where: { organizationId_key: { organizationId, key: setting.key } },
      });
      if (!existing) {
        await this.prisma.systemSetting.create({
          data: {
            organizationId,
            ...setting,
            value: setting.value as Prisma.InputJsonValue,
          },
        });
        results.push({ key: setting.key, status: 'CREATED' });
      } else {
        results.push({ key: setting.key, status: 'SKIPPED' });
      }
    }

    return results;
  }

  // ===== NOTIFICATIONS =====

  async createNotification(organizationId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        organizationId,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'INFO',
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
      },
    });
  }

  async listNotifications(
    organizationId: string,
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const where = {
      organizationId,
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { organizationId, userId, isRead: false },
      }),
    ]);

    return { data, total, unreadCount, page, limit };
  }

  async markNotificationRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllNotificationsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ===== AUDIT LOGS =====

  async createAuditLog(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        entityType,
        entityId,
        action,
        oldValues: oldValues as Prisma.InputJsonValue,
        newValues: newValues as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }

  async listAuditLogs(
    organizationId: string,
    page: number = 1,
    limit: number = 50,
    entityType?: string,
    entityId?: string,
    userId?: string,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(userId ? { userId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== FILE ATTACHMENTS =====

  async listFileAttachments(
    organizationId: string,
    entityType: string,
    entityId: string,
  ) {
    return this.prisma.fileAttachment.findMany({
      where: { organizationId, entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================================
  // CUSTOM FIELDS
  // ============================================================================

  async createCustomField(
    organizationId: string,
    data: {
      entityType: string;
      fieldName: string;
      fieldLabel: string;
      fieldType: string;
      isRequired?: boolean;
      defaultValue?: string;
      options?: string[];
      sortOrder?: number;
    },
  ) {
    return this.prisma.customField.create({
      data: {
        organizationId,
        entityType: data.entityType,
        fieldName: data.fieldName,
        fieldLabel: data.fieldLabel,
        fieldType: data.fieldType,
        isRequired: data.isRequired ?? false,
        defaultValue: data.defaultValue,
        options: data.options ?? [],
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async getCustomFields(organizationId: string, entityType?: string) {
    const where: Prisma.CustomFieldWhereInput = { organizationId, isActive: true };
    if (entityType) where.entityType = entityType;
    return this.prisma.customField.findMany({
      where,
      orderBy: [{ entityType: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async setCustomFieldValue(
    organizationId: string,
    data: { customFieldId: string; entityType: string; entityId: string; value: string },
  ) {
    const existing = await this.prisma.customFieldValue.findFirst({
      where: { organizationId, customFieldId: data.customFieldId, entityId: data.entityId },
    });
    if (existing) {
      return this.prisma.customFieldValue.update({
        where: { id: existing.id },
        data: { value: data.value },
      });
    }
    return this.prisma.customFieldValue.create({
      data: {
        organizationId,
        customFieldId: data.customFieldId,
        entityType: data.entityType,
        entityId: data.entityId,
        value: data.value,
      },
    });
  }

  async getCustomFieldValues(organizationId: string, entityId: string) {
    return this.prisma.customFieldValue.findMany({
      where: { organizationId, entityId },
    });
  }

  // ===== COMPANY BRANDING =====

  async updateCompanyBranding(organizationId: string, data: {
    logoUrl?: string; letterheadUrl?: string; termsAndConditions?: string;
  }) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        logoUrl: data.logoUrl,
        letterheadUrl: data.letterheadUrl,
        termsAndConditions: data.termsAndConditions,
      },
    });
  }

  async getCompanyBranding(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        letterheadUrl: true,
        termsAndConditions: true,
        address: true,
        city: true,
        state: true,
        country: true,
        phone: true,
        email: true,
        website: true,
        taxId: true,
        currency: true,
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async getLicenseInfo() {
    return {
      software: 'Grainix ERP',
      version: '1.0.0',
      license: 'Proprietary - All Rights Reserved',
      copyright: '(c) 2026 Grainix ERP. All rights reserved.',
      poweredBy: 'Asad Ali',
      contact: '0308-4420406',
      description: 'Enterprise Rice Industry Management Platform',
      features: [
        'Multi-tenant SaaS Architecture',
        'Multi-company Support',
        'Strict Double-Entry Accounting',
        'Real-time WebSocket Updates',
        'Email & Communication System',
        'Export with LC Management',
        'Commission & Settlement System',
        'Production & Milling Management',
        'Inventory & Warehouse Management',
        'HR & Payroll',
        'CRM & Sales Force',
        'Quality Control',
        'Transport & Logistics',
        'BI Reporting & Analytics',
        'Document Management',
        'Workflow & Approval Engine',
      ],
    };
  }
}
