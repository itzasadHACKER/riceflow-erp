import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalesQuotationDto, CreateBlanketAgreementDto } from './dto/sales-quotation.dto';

@Injectable()
export class SalesQuotationService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuotation(orgId: string, dto: CreateSalesQuotationDto) {
    const count = await this.prisma.salesQuotation.count({ where: { organizationId: orgId } });
    const quotationNumber = `SQ-${String(count + 1).padStart(4, '0')}`;
    const items = dto.items || [];
    const subtotal = items.reduce((s: number, i: any) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    return this.prisma.salesQuotation.create({
      data: { organizationId: orgId, quotationNumber, customerId: dto.customerId, contactPerson: dto.contactPerson, validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, currency: dto.currency || 'PKR', subtotal, totalAmount: subtotal, terms: dto.terms, notes: dto.notes, salespersonId: dto.salespersonId, items: items as any },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.salesQuotation.findMany({ where: { organizationId: orgId }, include: { customer: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(orgId: string, id: string) {
    const q = await this.prisma.salesQuotation.findFirst({ where: { id, organizationId: orgId }, include: { customer: true } });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async updateStatus(orgId: string, id: string, status: string) {
    await this.findOne(orgId, id);
    return this.prisma.salesQuotation.update({ where: { id }, data: { status } });
  }

  async convertToOrder(orgId: string, id: string) {
    const q = await this.findOne(orgId, id);
    return this.prisma.salesQuotation.update({ where: { id }, data: { status: 'CONVERTED', convertedToOrder: `SO-${Date.now()}` } });
  }

  async createBlanketAgreement(orgId: string, dto: CreateBlanketAgreementDto) {
    const count = await this.prisma.blanketAgreement.count({ where: { organizationId: orgId } });
    const agreementNumber = `BA-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.blanketAgreement.create({
      data: { organizationId: orgId, agreementNumber, type: dto.type, method: dto.method || 'ITEMS', partnerId: dto.partnerId, partnerType: dto.partnerType || 'CUSTOMER', startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), plannedAmount: dto.plannedAmount ?? 0, currency: dto.currency || 'PKR', terms: dto.terms, items: (dto.items || []) as any },
    });
  }

  async findAllAgreements(orgId: string, type?: string) {
    const where: any = { organizationId: orgId };
    if (type) where.type = type;
    return this.prisma.blanketAgreement.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async updateAgreementStatus(orgId: string, id: string, status: string) {
    return this.prisma.blanketAgreement.update({ where: { id }, data: { status } });
  }

  async getSummary(orgId: string) {
    const [quotations, openQuotations, agreements, activeAgreements] = await Promise.all([
      this.prisma.salesQuotation.count({ where: { organizationId: orgId } }),
      this.prisma.salesQuotation.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      this.prisma.blanketAgreement.count({ where: { organizationId: orgId } }),
      this.prisma.blanketAgreement.count({ where: { organizationId: orgId, status: 'APPROVED' } }),
    ]);
    return { totalQuotations: quotations, openQuotations, totalAgreements: agreements, activeAgreements };
  }
}
