import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  CreateExpenseEntryDto,
  ExpenseFilterDto,
} from './dto/expense.dto';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== EXPENSE CATEGORIES =====

  async createCategory(organizationId: string, dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        accountId: dto.accountId,
        parentId: dto.parentId,
      },
    });
  }

  async getCategories(organizationId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { organizationId, isActive: true },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateCategory(
    organizationId: string,
    id: string,
    dto: UpdateExpenseCategoryDto,
  ) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, organizationId },
    });
    if (!category) throw new NotFoundException('Expense category not found');
    return this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        accountId: dto.accountId,
        isActive: dto.isActive,
      },
    });
  }

  // ===== EXPENSE ENTRIES (using ExpenseClaim model) =====

  async createExpenseEntry(
    organizationId: string,
    dto: CreateExpenseEntryDto,
    createdBy?: string,
  ) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: dto.expenseCategoryId, organizationId },
    });
    if (!category) throw new NotFoundException('Expense category not found');

    const count = await this.prisma.expenseClaim.count({
      where: { organizationId },
    });
    const claimNumber = `EXP-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const expenseAccountId = dto.debitAccountId ?? category.accountId;
      let journalEntryId: string | undefined;

      if (expenseAccountId && dto.bankAccountId) {
        const bankAccount = await tx.bankAccount.findFirst({
          where: { id: dto.bankAccountId, organizationId },
        });
        if (!bankAccount) {
          throw new NotFoundException('Bank account not found');
        }

        const entryCount = await tx.journalEntry.count({
          where: { organizationId },
        });
        const entryNumber = `JE-${String(entryCount + 1).padStart(6, '0')}`;
        const totalAmount = new Prisma.Decimal(dto.amount).add(
          new Prisma.Decimal(dto.taxAmount ?? 0),
        );

        const journalEntry = await tx.journalEntry.create({
          data: {
            organizationId,
            entryNumber,
            date: new Date(dto.date),
            reference: claimNumber,
            narration:
              dto.narration ?? `Expense: ${category.name} - ${dto.description}`,
            entryType: 'EXPENSE',
            fiscalYearId: dto.fiscalYearId,
            isPosted: true,
            postedAt: new Date(),
            createdBy,
            lines: {
              create: [
                {
                  accountId: expenseAccountId,
                  debit: totalAmount,
                  credit: new Prisma.Decimal(0),
                  narration: `${category.name}: ${dto.description}`,
                },
                {
                  accountId: bankAccount.accountId,
                  debit: new Prisma.Decimal(0),
                  credit: totalAmount,
                  narration: `Payment for: ${dto.description}`,
                },
              ],
            },
          },
        });
        journalEntryId = journalEntry.id;
      }

      const expense = await tx.expenseClaim.create({
        data: {
          organizationId,
          claimNumber,
          date: new Date(dto.date),
          employeeId: createdBy ?? '',
          description: dto.description,
          totalAmount: new Prisma.Decimal(dto.amount),
          status: 'POSTED',
          journalEntryId,
        },
      });

      return expense;
    });
  }

  async getExpenseEntries(organizationId: string, filter: ExpenseFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.ExpenseClaimWhereInput = {
      organizationId,
    };
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { journalEntry: true },
      }),
      this.prisma.expenseClaim.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getExpenseSummary(
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: Prisma.ExpenseClaimWhereInput = {
      organizationId,
    };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const expenses = await this.prisma.expenseClaim.findMany({
      where,
    });

    let totalExpenses = new Prisma.Decimal(0);
    for (const exp of expenses) {
      totalExpenses = totalExpenses.add(exp.totalAmount);
    }

    return {
      totalEntries: expenses.length,
      totalAmount: totalExpenses.toString(),
      postedCount: expenses.filter((e) => e.status === 'POSTED').length,
      draftCount: expenses.filter((e) => e.status === 'DRAFT').length,
    };
  }
}
