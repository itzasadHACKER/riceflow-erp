import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePurchaseRequisitionDto, CreatePurchaseQuotationDto } from './dto/purchase-enhancement.dto';

@Injectable()
export class PurchaseEnhancementService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequisition(orgId: string, userId: string, dto: CreatePurchaseRequisitionDto) {
    const count = await this.prisma.purchaseRequisition.count({ where: { organizationId: orgId } });
    const requisitionNumber = `PR-${String(count + 1).padStart(4, '0')}`;
    const items = dto.items || [];
    const totalAmount = items.reduce((s: number, i: any) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    return this.prisma.purchaseRequisition.create({
      data: { organizationId: orgId, requisitionNumber, requestedById: userId, departmentId: dto.departmentId, requiredDate: new Date(dto.requiredDate), priority: dto.priority || 'NORMAL', justification: dto.justification, totalAmount, items: items as any },
    });
  }

  async findAllRequisitions(orgId: string) {
    return this.prisma.purchaseRequisition.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async approveRequisition(orgId: string, id: string, userId: string) {
    return this.prisma.purchaseRequisition.update({ where: { id }, data: { status: 'APPROVED', approvedById: userId, approvedAt: new Date() } });
  }

  async createPurchaseQuotation(orgId: string, dto: CreatePurchaseQuotationDto) {
    const count = await this.prisma.purchaseQuotation.count({ where: { organizationId: orgId } });
    const quotationNumber = `PQ-${String(count + 1).padStart(4, '0')}`;
    const items = dto.items || [];
    const totalAmount = items.reduce((s: number, i: any) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    return this.prisma.purchaseQuotation.create({
      data: { organizationId: orgId, quotationNumber, supplierId: dto.supplierId, validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined, currency: dto.currency || 'PKR', totalAmount, terms: dto.terms, notes: dto.notes, items: items as any },
      include: { supplier: { select: { id: true, name: true } } },
    });
  }

  async findAllPurchaseQuotations(orgId: string) {
    return this.prisma.purchaseQuotation.findMany({ where: { organizationId: orgId }, include: { supplier: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async selectQuotation(orgId: string, id: string) {
    return this.prisma.purchaseQuotation.update({ where: { id }, data: { selected: true, status: 'SELECTED' } });
  }

  async compareQuotations(orgId: string, ids: string[]) {
    return this.prisma.purchaseQuotation.findMany({ where: { id: { in: ids }, organizationId: orgId }, include: { supplier: { select: { id: true, name: true } } } });
  }

  async getSummary(orgId: string) {
    const [requisitions, pendingReqs, quotations, selectedQuotes] = await Promise.all([
      this.prisma.purchaseRequisition.count({ where: { organizationId: orgId } }),
      this.prisma.purchaseRequisition.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      this.prisma.purchaseQuotation.count({ where: { organizationId: orgId } }),
      this.prisma.purchaseQuotation.count({ where: { organizationId: orgId, selected: true } }),
    ]);
    return { totalRequisitions: requisitions, pendingRequisitions: pendingReqs, totalQuotations: quotations, selectedQuotations: selectedQuotes };
  }
}
