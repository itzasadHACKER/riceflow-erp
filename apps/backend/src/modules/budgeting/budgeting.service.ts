import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateBudgetDto, UpdateBudgetStatusDto } from './dto/budget.dto';

@Injectable()
export class BudgetingService {
  constructor(private readonly prisma: PrismaService) {}

  async createBudget(organizationId: string, dto: CreateBudgetDto) {
    const totalAmount = dto.lines.reduce((sum, l) => sum + parseFloat(l.annualAmount), 0);

    return this.prisma.$transaction(async (tx) => {
      const budget = await tx.budget.create({
        data: {
          organizationId,
          name: dto.name,
          fiscalYearId: dto.fiscalYearId,
          departmentId: dto.departmentId,
          branchId: dto.branchId,
          costCenter: dto.costCenter,
          totalAmount: new Prisma.Decimal(totalAmount),
          notes: dto.notes,
          status: 'DRAFT_BUDGET',
        },
      });

      for (const line of dto.lines) {
        await tx.budgetLine.create({
          data: {
            budgetId: budget.id,
            accountId: line.accountId,
            annualAmount: new Prisma.Decimal(line.annualAmount),
            monthlyAmounts: (line.monthlyAmounts ?? {}) as Prisma.InputJsonValue,
            notes: line.notes,
          },
        });
      }

      return tx.budget.findFirst({
        where: { id: budget.id },
        include: { lines: { include: { account: true } }, fiscalYear: true },
      });
    });
  }

  async getBudgets(organizationId: string, fiscalYearId?: string) {
    const where: Prisma.BudgetWhereInput = { organizationId };
    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    return this.prisma.budget.findMany({
      where,
      include: { fiscalYear: true, lines: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBudgetById(organizationId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, organizationId },
      include: { lines: { include: { account: true } }, fiscalYear: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async updateStatus(organizationId: string, id: string, dto: UpdateBudgetStatusDto, userId?: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, organizationId } });
    if (!budget) throw new NotFoundException('Budget not found');
    const data: Prisma.BudgetUpdateInput = { status: dto.status };
    if (dto.status === 'ACTIVE_BUDGET') {
      data.approvedBy = userId;
      data.approvedAt = new Date();
    }
    return this.prisma.budget.update({ where: { id }, data });
  }

  async getBudgetVariance(organizationId: string, budgetId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, organizationId },
      include: { lines: { include: { account: true } }, fiscalYear: true },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    const varianceLines = [];
    for (const line of budget.lines) {
      const actualEntries = await this.prisma.journalEntryLine.aggregate({
        where: {
          journalEntry: { organizationId, fiscalYearId: budget.fiscalYearId, isPosted: true },
          accountId: line.accountId,
        },
        _sum: { debit: true, credit: true },
      });
      const actualDebit = Number(actualEntries._sum?.debit ?? 0);
      const actualCredit = Number(actualEntries._sum?.credit ?? 0);
      const actualAmount = actualDebit - actualCredit;
      const budgeted = Number(line.annualAmount);
      varianceLines.push({
        accountId: line.accountId,
        accountName: line.account.name,
        accountCode: line.account.code,
        budgetedAmount: budgeted,
        actualAmount,
        variance: budgeted - actualAmount,
        variancePercent: budgeted !== 0 ? ((budgeted - actualAmount) / budgeted) * 100 : 0,
      });
    }

    return {
      budget: { id: budget.id, name: budget.name, totalAmount: Number(budget.totalAmount) },
      fiscalYear: budget.fiscalYear,
      lines: varianceLines,
      summary: {
        totalBudgeted: varianceLines.reduce((s, l) => s + l.budgetedAmount, 0),
        totalActual: varianceLines.reduce((s, l) => s + l.actualAmount, 0),
        totalVariance: varianceLines.reduce((s, l) => s + l.variance, 0),
      },
    };
  }

  async deleteBudget(organizationId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({ where: { id, organizationId } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.status === 'ACTIVE_BUDGET') {
      throw new BadRequestException('Cannot delete an active budget');
    }
    await this.prisma.budgetLine.deleteMany({ where: { budgetId: id } });
    return this.prisma.budget.delete({ where: { id } });
  }
}
