import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePaymentRunDto, CreateDunningLevelDto, RunDunningDto } from './dto/payment-wizard.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentWizardService {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentRun(orgId: string, dto: CreatePaymentRunDto) {
    const count = await this.prisma.paymentRun.count({ where: { organizationId: orgId } });
    const runNumber = `PAY-${String(count + 1).padStart(4, '0')}`;
    const payments = dto.payments || [];
    const totalAmount = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return this.prisma.paymentRun.create({ data: { organizationId: orgId, runNumber, type: dto.type || 'OUTGOING', paymentMethod: dto.paymentMethod || 'BANK_TRANSFER', totalAmount, paymentsCount: payments.length, payments: payments as any, filters: dto.filters as any } });
  }

  async findAllPaymentRuns(orgId: string) {
    return this.prisma.paymentRun.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async processPaymentRun(orgId: string, id: string) {
    return this.prisma.paymentRun.update({ where: { id }, data: { status: 'PROCESSED', processedAt: new Date() } });
  }

  async createDunningLevel(orgId: string, dto: CreateDunningLevelDto) {
    return this.prisma.dunningLevel.create({ data: { organizationId: orgId, level: dto.level, name: dto.name, daysOverdue: dto.daysOverdue, chargePercent: dto.chargePercent ?? 0, chargeAmount: dto.chargeAmount ?? 0, letterTemplate: dto.letterTemplate } });
  }

  async findDunningLevels(orgId: string) {
    return this.prisma.dunningLevel.findMany({ where: { organizationId: orgId }, orderBy: { level: 'asc' } });
  }

  async runDunning(orgId: string, dto: RunDunningDto) {
    const count = await this.prisma.dunningRun.count({ where: { organizationId: orgId } });
    const levels = await this.prisma.dunningLevel.findMany({ where: { organizationId: orgId, isActive: true }, orderBy: { daysOverdue: 'desc' } });
    const invoices = await this.prisma.salesInvoice.findMany({ where: { organizationId: orgId, paymentStatus: 'UNPAID' } });
    const today = dto.asOfDate ? new Date(dto.asOfDate) : new Date();
    const entries: any[] = [];
    let totalOverdue = new Decimal(0);

    for (const inv of invoices) {
      const daysPast = Math.floor((today.getTime() - inv.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysPast > 0) {
        const matchedLevel = levels.find((l) => daysPast >= l.daysOverdue);
        if (matchedLevel) {
          entries.push({ invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, customerId: inv.customerId, amount: inv.totalAmount, daysOverdue: daysPast, dunningLevel: matchedLevel.level, levelName: matchedLevel.name });
          totalOverdue = totalOverdue.add(inv.totalAmount);
        }
      }
    }

    return this.prisma.dunningRun.create({ data: { organizationId: orgId, customersCount: new Set(entries.map((e) => e.customerId)).size, totalOverdue, entries: entries as any } });
  }

  async findDunningRuns(orgId: string) {
    return this.prisma.dunningRun.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async getSummary(orgId: string) {
    const [paymentRuns, pendingRuns, dunningLevels, dunningRuns] = await Promise.all([
      this.prisma.paymentRun.count({ where: { organizationId: orgId } }),
      this.prisma.paymentRun.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      this.prisma.dunningLevel.count({ where: { organizationId: orgId } }),
      this.prisma.dunningRun.count({ where: { organizationId: orgId } }),
    ]);
    return { totalPaymentRuns: paymentRuns, pendingRuns, dunningLevels, totalDunningRuns: dunningRuns };
  }
}
