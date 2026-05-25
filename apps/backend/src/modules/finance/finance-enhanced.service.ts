import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinanceEnhancedService {
  constructor(private prisma: PrismaService) {}

  private async getCurrentFiscalYear(orgId: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { organizationId: orgId, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    });
    if (!fy) {
      const fallback = await this.prisma.fiscalYear.findFirst({
        where: { organizationId: orgId },
        orderBy: { endDate: 'desc' },
      });
      if (!fallback) throw new BadRequestException('No fiscal year configured');
      return fallback.id;
    }
    return fy.id;
  }

  // ─── Recurring Journal Entries ──────────────────────────────
  async createRecurringJournal(orgId: string, _userId: string, dto: any) {
    return this.prisma.scheduledJob.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        jobType: 'RECURRING_JE',
        schedule: dto.frequency,
        nextRunAt: new Date(dto.startDate),
        config: { lines: dto.lines, endDate: dto.endDate } as unknown as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }

  async findRecurringJournals(orgId: string) {
    return this.prisma.scheduledJob.findMany({
      where: { organizationId: orgId, jobType: 'RECURRING_JE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async executeRecurringJournal(orgId: string, userId: string, jobId: string) {
    const job = await this.prisma.scheduledJob.findFirst({ where: { id: jobId, organizationId: orgId } });
    if (!job) throw new NotFoundException('Recurring journal not found');

    const fiscalYearId = await this.getCurrentFiscalYear(orgId);
    const config = job.config as { lines: { accountId: string; debit: number; credit: number; narration?: string }[] };
    const count = await this.prisma.journalEntry.count({ where: { organizationId: orgId } });
    const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

    const je = await this.prisma.journalEntry.create({
      data: {
        organizationId: orgId,
        entryNumber,
        date: new Date(),
        reference: `REC-${job.name}`,
        narration: `Recurring: ${job.name}`,
        entryType: 'SYSTEM',
        fiscalYearId,
        createdBy: userId,
        isPosted: true,
        postedBy: userId,
        postedAt: new Date(),
        lines: {
          create: config.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit || 0,
            credit: l.credit || 0,
            narration: l.narration || '',
          })),
        },
      },
    });

    const nextRun = job.nextRunAt ? new Date(job.nextRunAt) : new Date();
    switch (job.schedule) {
      case 'WEEKLY': nextRun.setDate(nextRun.getDate() + 7); break;
      case 'MONTHLY': nextRun.setMonth(nextRun.getMonth() + 1); break;
      case 'QUARTERLY': nextRun.setMonth(nextRun.getMonth() + 3); break;
      case 'YEARLY': nextRun.setFullYear(nextRun.getFullYear() + 1); break;
    }

    await this.prisma.scheduledJob.update({
      where: { id: jobId },
      data: { nextRunAt: nextRun, lastRunAt: new Date() },
    });
    return je;
  }

  // ─── Bank Statement Import ──────────────────────────────────
  async importBankStatement(orgId: string, userId: string, dto: any) {
    const bank = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, organizationId: orgId },
    });
    if (!bank) throw new NotFoundException('Bank account not found');

    const fiscalYearId = await this.getCurrentFiscalYear(orgId);
    const bankChartAccount = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId: orgId, code: '1120' },
    });
    const suspenseAccount = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId: orgId, accountType: 'EXPENSE' },
    });

    if (!bankChartAccount || !suspenseAccount) {
      throw new BadRequestException('Required chart of accounts not found (Bank 1120 or Expense account)');
    }

    const results: { transaction: any; journalEntryId: string; status: string }[] = [];
    for (const tx of dto.transactions) {
      const jeCount = await this.prisma.journalEntry.count({ where: { organizationId: orgId } });
      const isDeposit = tx.type === 'CREDIT' || tx.amount > 0;
      const amount = Math.abs(tx.amount);

      const je = await this.prisma.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: new Date(tx.date),
          reference: tx.reference || `BSI-${(tx.description || '').substring(0, 20)}`,
          narration: `Bank statement: ${tx.description}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: false,
          lines: {
            create: [
              { accountId: bankChartAccount.id, debit: isDeposit ? amount : 0, credit: isDeposit ? 0 : amount, narration: tx.description },
              { accountId: suspenseAccount.id, debit: isDeposit ? 0 : amount, credit: isDeposit ? amount : 0, narration: `Auto-imported: ${tx.description}` },
            ],
          },
        },
      });
      results.push({ transaction: tx, journalEntryId: je.id, status: 'IMPORTED' });
    }

    return { imported: results.length, transactions: results };
  }

  // ─── Financial Report Templates ─────────────────────────────
  async createReportTemplate(orgId: string, dto: any) {
    return this.prisma.printTemplate.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        entityType: dto.reportType || 'REPORT',
        template: dto.layout,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findReportTemplates(orgId: string) {
    return this.prisma.printTemplate.findMany({
      where: { organizationId: orgId, entityType: { in: ['REPORT', 'FINANCIAL_STATEMENT'] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Multi-Branch ───────────────────────────────────────────
  async findBranches(orgId: string) {
    return this.prisma.branch.findMany({ where: { organizationId: orgId }, orderBy: { name: 'asc' } });
  }

  async getBranchPnL(orgId: string, branchId: string) {
    const purchases = await this.prisma.paddyPurchase.findMany({
      where: { organizationId: orgId, branchId },
    });
    const totalExpense = purchases.reduce((s, p) => s + Number(p.netAmount), 0);

    const batches = await this.prisma.productionBatch.findMany({
      where: { organizationId: orgId, branchId },
    });
    const totalProduction = batches.reduce((s, b) => s + Number(b.inputWeight || 0), 0);

    return {
      branchId,
      totalPurchases: totalExpense,
      totalProductionOutput: totalProduction,
      purchaseCount: purchases.length,
      batchCount: batches.length,
    };
  }

  // ─── Posting Period Authorization ──────────────────────────
  async checkPeriodAuth(orgId: string, _userId: string, date: Date) {
    const period = await this.prisma.financialPeriod.findFirst({
      where: { organizationId: orgId, startDate: { lte: date }, endDate: { gte: date } },
    });
    if (!period) return { allowed: true, message: 'No period restriction found' };
    if (period.status === 'CLOSED') return { allowed: false, message: `Period ${period.name} is closed` };
    return { allowed: true, period: period.name };
  }

  // ─── Summary ────────────────────────────────────────────────
  async getFinanceEnhancedSummary(orgId: string) {
    const [recurringJobs, branches, reportTemplates] = await Promise.all([
      this.prisma.scheduledJob.count({ where: { organizationId: orgId, jobType: 'RECURRING_JE' } }),
      this.prisma.branch.count({ where: { organizationId: orgId } }),
      this.prisma.printTemplate.count({ where: { organizationId: orgId } }),
    ]);
    return { recurringJournals: recurringJobs, branches, reportTemplates };
  }
}
