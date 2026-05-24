import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCommissionRuleDto, CreateCommissionEntryDto, CreateSettlementDto } from './dto/commission.dto';

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Commission Rules ---
  async createRule(organizationId: string, dto: CreateCommissionRuleDto) {
    return this.prisma.commissionRule.create({
      data: {
        organizationId,
        name: dto.name,
        entityType: dto.entityType,
        commissionType: dto.commissionType,
        rate: new Prisma.Decimal(dto.rate),
        isPercentage: dto.isPercentage ?? true,
        minAmount: dto.minAmount ? new Prisma.Decimal(dto.minAmount) : undefined,
        maxAmount: dto.maxAmount ? new Prisma.Decimal(dto.maxAmount) : undefined,
      },
    });
  }

  async getRules(organizationId: string) {
    return this.prisma.commissionRule.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  // --- Commission Entries ---
  async createEntry(organizationId: string, dto: CreateCommissionEntryDto) {
    return this.prisma.commissionEntry.create({
      data: {
        organizationId,
        partyType: dto.partyType,
        partyId: dto.partyId,
        partyName: dto.partyName,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber,
        transactionAmount: new Prisma.Decimal(dto.transactionAmount),
        commissionRate: new Prisma.Decimal(dto.commissionRate),
        commissionAmount: new Prisma.Decimal(dto.commissionAmount),
        date: new Date(dto.date),
      },
    });
  }

  async calculateCommission(organizationId: string, entityType: string, transactionAmount: string) {
    const rule = await this.prisma.commissionRule.findFirst({
      where: { organizationId, entityType, isActive: true },
    });
    if (!rule) return { commissionAmount: 0, rule: null };

    const amount = parseFloat(transactionAmount);

    if (rule.minAmount && amount < Number(rule.minAmount)) {
      return { transactionAmount: amount, commissionRate: 0, isPercentage: rule.isPercentage, commissionAmount: 0, rule, note: 'Transaction below minimum amount' };
    }
    if (rule.maxAmount && amount > Number(rule.maxAmount)) {
      return { transactionAmount: amount, commissionRate: 0, isPercentage: rule.isPercentage, commissionAmount: 0, rule, note: 'Transaction exceeds maximum amount' };
    }

    let commission: number;
    if (rule.isPercentage) {
      commission = (amount * Number(rule.rate)) / 100;
    } else {
      commission = Number(rule.rate);
    }

    return {
      transactionAmount: amount,
      commissionRate: Number(rule.rate),
      isPercentage: rule.isPercentage,
      commissionAmount: Math.round(commission * 100) / 100,
      rule,
    };
  }

  async getEntries(organizationId: string, partyId?: string) {
    const where: Prisma.CommissionEntryWhereInput = { organizationId };
    if (partyId) where.partyId = partyId;
    return this.prisma.commissionEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getPendingCommissions(organizationId: string, partyId?: string) {
    const where: Prisma.CommissionEntryWhereInput = {
      organizationId,
      settlementStatus: 'PENDING_SETTLEMENT',
    };
    if (partyId) where.partyId = partyId;
    return this.prisma.commissionEntry.findMany({ where, orderBy: { date: 'asc' } });
  }

  // --- Settlements ---
  async createSettlement(organizationId: string, dto: CreateSettlementDto) {
    const pending = await this.prisma.commissionEntry.findMany({
      where: { organizationId, partyId: dto.partyId, settlementStatus: 'PENDING_SETTLEMENT' },
    });
    const totalAmount = pending.reduce((s, e) => s + Number(e.commissionAmount), 0);

    return this.prisma.$transaction(async (tx) => {
      const series = await tx.numberingSeries.findFirst({
        where: { organizationId, entityType: 'SETTLEMENT' },
      });
      const currentNumber = series ? series.currentNumber + 1 : 1;
      const settlementNumber = `SET-${String(currentNumber).padStart(6, '0')}`;
      if (series) {
        await tx.numberingSeries.update({ where: { id: series.id }, data: { currentNumber } });
      }

      const settlement = await tx.settlement.create({
        data: {
          organizationId,
          settlementNumber,
          partyType: dto.partyType,
          partyId: dto.partyId,
          partyName: dto.partyName,
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(totalAmount),
          status: 'SETTLED',
          paymentMode: dto.paymentMode,
          paymentRef: dto.paymentRef,
          date: new Date(dto.date),
          notes: dto.notes,
        },
      });

      for (const entry of pending) {
        await tx.commissionEntry.update({
          where: { id: entry.id },
          data: { settlementStatus: 'SETTLED', settlementId: settlement.id },
        });
      }

      return settlement;
    });
  }

  async getSettlements(organizationId: string, partyId?: string) {
    const where: Prisma.SettlementWhereInput = { organizationId };
    if (partyId) where.partyId = partyId;
    return this.prisma.settlement.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getCommissionSummary(organizationId: string) {
    const entries = await this.prisma.commissionEntry.findMany({ where: { organizationId } });
    const partyMap = new Map<string, { partyName: string; total: number; pending: number; settled: number }>();
    for (const e of entries) {
      const existing = partyMap.get(e.partyId) ?? { partyName: e.partyName, total: 0, pending: 0, settled: 0 };
      const amount = Number(e.commissionAmount);
      existing.total += amount;
      if (e.settlementStatus === 'PENDING_SETTLEMENT') existing.pending += amount;
      else existing.settled += amount;
      partyMap.set(e.partyId, existing);
    }
    return Array.from(partyMap.entries()).map(([partyId, data]) => ({ partyId, ...data }));
  }
}
