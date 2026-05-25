import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFinancialPeriodDto, CreateWithholdingTaxDto, CreateInternalReconciliationDto, CreateAdvancePaymentDto } from './dto/financial-period.dto';

@Injectable()
export class FinancialPeriodService {
  constructor(private readonly prisma: PrismaService) {}

  async createPeriod(orgId: string, dto: CreateFinancialPeriodDto) {
    return this.prisma.financialPeriod.create({ data: { organizationId: orgId, fiscalYearId: dto.fiscalYearId, periodNumber: dto.periodNumber, name: dto.name, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate) } });
  }

  async findAllPeriods(orgId: string) {
    return this.prisma.financialPeriod.findMany({ where: { organizationId: orgId }, orderBy: [{ fiscalYearId: 'desc' }, { periodNumber: 'asc' }] });
  }

  async closePeriod(orgId: string, id: string, userId: string) {
    return this.prisma.financialPeriod.update({ where: { id }, data: { status: 'CLOSED', closedAt: new Date(), closedById: userId } });
  }

  async reopenPeriod(orgId: string, id: string) {
    return this.prisma.financialPeriod.update({ where: { id }, data: { status: 'OPEN', closedAt: null, closedById: null } });
  }

  async createWithholdingTax(orgId: string, dto: CreateWithholdingTaxDto) {
    return this.prisma.withholdingTaxConfig.create({ data: { organizationId: orgId, name: dto.name, code: dto.code, rate: dto.rate, applicableTo: dto.applicableTo || 'VENDOR', thresholdAmount: dto.thresholdAmount ?? 0, accountCode: dto.accountCode } });
  }

  async findWithholdingTaxes(orgId: string) {
    return this.prisma.withholdingTaxConfig.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async createInternalReconciliation(orgId: string, dto: CreateInternalReconciliationDto) {
    const count = await this.prisma.internalReconciliation.count({ where: { organizationId: orgId } });
    const reconcNumber = `IR-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.internalReconciliation.create({ data: { organizationId: orgId, reconcNumber, partnerId: dto.partnerId, partnerType: dto.partnerType || 'CUSTOMER', totalAmount: dto.totalAmount, entries: (dto.entries || []) as any } });
  }

  async findReconciliations(orgId: string) {
    return this.prisma.internalReconciliation.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async createAdvancePayment(orgId: string, dto: CreateAdvancePaymentDto) {
    const count = await this.prisma.advancePayment.count({ where: { organizationId: orgId } });
    const paymentNumber = `ADV-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.advancePayment.create({ data: { organizationId: orgId, paymentNumber, partnerId: dto.partnerId, partnerType: dto.partnerType || 'CUSTOMER', amount: dto.amount, remainingAmount: dto.amount, paymentMethod: dto.paymentMethod || 'BANK_TRANSFER', reference: dto.reference } });
  }

  async findAdvancePayments(orgId: string) {
    return this.prisma.advancePayment.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async applyAdvancePayment(orgId: string, id: string, applyAmount: number) {
    const adv = await this.prisma.advancePayment.findFirst({ where: { id, organizationId: orgId } });
    if (!adv) throw new NotFoundException('Advance payment not found');
    const newApplied = Number(adv.appliedAmount) + applyAmount;
    const newRemaining = Number(adv.amount) - newApplied;
    if (newRemaining < 0) throw new BadRequestException('Applied amount exceeds advance payment');
    return this.prisma.advancePayment.update({ where: { id }, data: { appliedAmount: newApplied, remainingAmount: newRemaining, status: newRemaining === 0 ? 'FULLY_APPLIED' : 'PARTIALLY_APPLIED' } });
  }

  async getSummary(orgId: string) {
    const [periods, openPeriods, whtConfigs, advances] = await Promise.all([
      this.prisma.financialPeriod.count({ where: { organizationId: orgId } }),
      this.prisma.financialPeriod.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.prisma.withholdingTaxConfig.count({ where: { organizationId: orgId } }),
      this.prisma.advancePayment.count({ where: { organizationId: orgId, status: 'OPEN' } }),
    ]);
    return { totalPeriods: periods, openPeriods, withholdingTaxConfigs: whtConfigs, openAdvances: advances };
  }
}
