import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AccountingEngineService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== PERIOD LOCKING =====

  async lockPeriod(organizationId: string, fiscalYearId: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id: fiscalYearId, organizationId },
    });
    if (!fy) throw new NotFoundException('Fiscal year not found');
    return this.prisma.fiscalYear.update({
      where: { id: fiscalYearId },
      data: { isActive: false },
    });
  }

  async unlockPeriod(organizationId: string, fiscalYearId: string) {
    return this.prisma.fiscalYear.update({
      where: { id: fiscalYearId },
      data: { isActive: true },
    });
  }

  async validatePostingPeriod(organizationId: string, date: Date) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
    if (!fy) throw new BadRequestException(`No fiscal year covers date ${date.toISOString().split('T')[0]}`);
    if (!fy.isActive) throw new ForbiddenException(`Fiscal year ${fy.name} is locked. Cannot post to this period.`);
    return fy;
  }

  // ===== TRIAL BALANCE VERIFICATION =====

  async verifyTrialBalance(organizationId: string, fiscalYearId?: string) {
    const where: Prisma.JournalEntryLineWhereInput = {
      journalEntry: {
        organizationId,
        isPosted: true,
        deletedAt: null,
        ...(fiscalYearId ? { fiscalYearId } : {}),
      },
    };

    const result = await this.prisma.journalEntryLine.aggregate({
      where,
      _sum: { debit: true, credit: true },
    });

    const totalDebit = result._sum.debit || new Prisma.Decimal(0);
    const totalCredit = result._sum.credit || new Prisma.Decimal(0);
    const difference = new Prisma.Decimal(totalDebit.toString()).sub(new Prisma.Decimal(totalCredit.toString()));
    const isBalanced = difference.equals(new Prisma.Decimal(0));

    return {
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      difference: difference.toString(),
      isBalanced,
      status: isBalanced ? 'BALANCED' : 'UNBALANCED',
      verifiedAt: new Date().toISOString(),
    };
  }

  // ===== ACCOUNT BALANCE CALCULATOR =====

  async getAccountBalance(organizationId: string, accountId: string, asOfDate?: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: accountId, organizationId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const dateFilter = asOfDate ? { lte: new Date(asOfDate) } : undefined;
    const result = await this.prisma.journalEntryLine.aggregate({
      where: {
        accountId,
        journalEntry: {
          organizationId,
          isPosted: true,
          deletedAt: null,
          ...(dateFilter ? { date: dateFilter } : {}),
        },
      },
      _sum: { debit: true, credit: true },
    });

    const totalDebit = new Prisma.Decimal(result._sum.debit?.toString() || '0');
    const totalCredit = new Prisma.Decimal(result._sum.credit?.toString() || '0');
    const openingBalance = new Prisma.Decimal(account.openingBalance.toString());

    let balance: Prisma.Decimal;
    if (account.balanceType === 'DEBIT') {
      balance = openingBalance.add(totalDebit).sub(totalCredit);
    } else {
      balance = openingBalance.add(totalCredit).sub(totalDebit);
    }

    return {
      accountId,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      balanceType: account.balanceType,
      openingBalance: openingBalance.toString(),
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
      closingBalance: balance.toString(),
      isDebitBalance: balance.greaterThanOrEqualTo(0) && account.balanceType === 'DEBIT',
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    };
  }

  // ===== CLOSING BALANCE CARRY-FORWARD =====

  async closeFiscalYear(organizationId: string, userId: string, fiscalYearId: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id: fiscalYearId, organizationId },
    });
    if (!fy) throw new NotFoundException('Fiscal year not found');

    const tbCheck = await this.verifyTrialBalance(organizationId, fiscalYearId);
    if (!tbCheck.isBalanced) {
      throw new BadRequestException(`Cannot close fiscal year: Trial balance is unbalanced by ${tbCheck.difference}`);
    }

    const revenueAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'REVENUE', isGroup: false },
    });
    const expenseAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'EXPENSE', isGroup: false },
    });

    const retainedEarnings = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId, code: '3200' },
    });
    if (!retainedEarnings) throw new BadRequestException('Retained Earnings account (3200) not found');

    return this.prisma.$transaction(async (tx) => {
      const closingLines: { accountId: string; debit: number; credit: number; narration: string }[] = [];
      let netIncome = new Prisma.Decimal(0);

      for (const acc of revenueAccounts) {
        const bal = await tx.journalEntryLine.aggregate({
          where: { accountId: acc.id, journalEntry: { fiscalYearId, isPosted: true, deletedAt: null } },
          _sum: { debit: true, credit: true },
        });
        const credit = new Prisma.Decimal(bal._sum.credit?.toString() || '0');
        const debit = new Prisma.Decimal(bal._sum.debit?.toString() || '0');
        const net = credit.sub(debit);
        if (!net.equals(0)) {
          closingLines.push({
            accountId: acc.id,
            debit: Number(net.toString()),
            credit: 0,
            narration: `Close ${acc.name} to Retained Earnings`,
          });
          netIncome = netIncome.add(net);
        }
      }

      for (const acc of expenseAccounts) {
        const bal = await tx.journalEntryLine.aggregate({
          where: { accountId: acc.id, journalEntry: { fiscalYearId, isPosted: true, deletedAt: null } },
          _sum: { debit: true, credit: true },
        });
        const debit = new Prisma.Decimal(bal._sum.debit?.toString() || '0');
        const credit = new Prisma.Decimal(bal._sum.credit?.toString() || '0');
        const net = debit.sub(credit);
        if (!net.equals(0)) {
          closingLines.push({
            accountId: acc.id,
            debit: 0,
            credit: Number(net.toString()),
            narration: `Close ${acc.name} to Retained Earnings`,
          });
          netIncome = netIncome.sub(net);
        }
      }

      if (closingLines.length > 0) {
        closingLines.push({
          accountId: retainedEarnings.id,
          debit: netIncome.lessThan(0) ? Number(netIncome.abs().toString()) : 0,
          credit: netIncome.greaterThan(0) ? Number(netIncome.toString()) : 0,
          narration: `Net income transferred to Retained Earnings`,
        });

        const entryCount = await tx.journalEntry.count({ where: { organizationId } });
        await tx.journalEntry.create({
          data: {
            organizationId,
            entryNumber: `JE-${String(entryCount + 1).padStart(6, '0')}`,
            date: fy.endDate,
            reference: `FY-CLOSE-${fy.name}`,
            narration: `Year-end closing entry for ${fy.name}`,
            entryType: 'SYSTEM',
            fiscalYearId,
            isPosted: true,
            postedBy: userId,
            postedAt: new Date(),
            createdBy: userId,
            lines: { create: closingLines },
          },
        });
      }

      await tx.fiscalYear.update({
        where: { id: fiscalYearId },
        data: { isActive: false },
      });

      return {
        closedFiscalYear: fy.name,
        netIncome: netIncome.toString(),
        closingEntriesCount: closingLines.length,
        status: 'CLOSED',
      };
    });
  }

  // ===== OPENING BALANCE IMPORT =====

  async importOpeningBalances(
    organizationId: string,
    balances: { accountCode: string; debit: number; credit: number }[],
  ) {
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const b of balances) {
      totalDebit = totalDebit.add(new Prisma.Decimal(b.debit));
      totalCredit = totalCredit.add(new Prisma.Decimal(b.credit));
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(
        `Opening balances must be balanced. Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${totalDebit.sub(totalCredit)}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      let updated = 0;
      for (const b of balances) {
        const account = await tx.chartOfAccount.findFirst({
          where: { organizationId, code: b.accountCode },
        });
        if (!account) throw new BadRequestException(`Account ${b.accountCode} not found`);
        if (account.isGroup) throw new BadRequestException(`Cannot set opening balance on group account ${b.accountCode}`);

        const openingBalance = account.balanceType === 'DEBIT'
          ? new Prisma.Decimal(b.debit).sub(new Prisma.Decimal(b.credit))
          : new Prisma.Decimal(b.credit).sub(new Prisma.Decimal(b.debit));

        await tx.chartOfAccount.update({
          where: { id: account.id },
          data: { openingBalance },
        });
        updated++;
      }
      return { updated, totalDebit: totalDebit.toString(), totalCredit: totalCredit.toString() };
    });
  }

  // ===== DATA INTEGRITY CHECKS =====

  async runIntegrityChecks(organizationId: string) {
    const checks: { check: string; status: string; details: string }[] = [];

    // 1. All posted JEs balanced
    const unbalancedJEs = await this.prisma.$queryRaw<{ id: string; entry_number: string; diff: number }[]>`
      SELECT je.id, je.entry_number,
        ABS(COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)) as diff
      FROM journal_entries je
      JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
      WHERE je.organization_id = ${organizationId}::uuid
        AND je.is_posted = true
        AND je.deleted_at IS NULL
      GROUP BY je.id, je.entry_number
      HAVING ABS(COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)) > 0.001
    `;
    checks.push({
      check: 'Journal Entry Balance',
      status: unbalancedJEs.length === 0 ? 'PASS' : 'FAIL',
      details: unbalancedJEs.length === 0
        ? 'All posted journal entries are balanced'
        : `${unbalancedJEs.length} unbalanced entries: ${unbalancedJEs.map(j => j.entry_number).join(', ')}`,
    });

    // 2. Trial balance check
    const tbResult = await this.verifyTrialBalance(organizationId);
    checks.push({
      check: 'Trial Balance',
      status: tbResult.isBalanced ? 'PASS' : 'FAIL',
      details: tbResult.isBalanced
        ? `Balanced: Dr ${tbResult.totalDebit} = Cr ${tbResult.totalCredit}`
        : `Unbalanced by ${tbResult.difference}`,
    });

    // 3. Orphaned JE lines
    const orphanedLines = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM journal_entry_lines jel
      LEFT JOIN chart_of_accounts coa ON coa.id = jel.account_id
      WHERE coa.id IS NULL
    `;
    const orphanCount = Number(orphanedLines[0]?.count || 0);
    checks.push({
      check: 'Orphaned JE Lines',
      status: orphanCount === 0 ? 'PASS' : 'WARN',
      details: orphanCount === 0 ? 'No orphaned lines' : `${orphanCount} lines reference deleted accounts`,
    });

    // 4. Duplicate entry numbers
    const duplicates = await this.prisma.$queryRaw<{ entry_number: string; cnt: bigint }[]>`
      SELECT entry_number, COUNT(*) as cnt
      FROM journal_entries
      WHERE organization_id = ${organizationId}::uuid AND deleted_at IS NULL
      GROUP BY entry_number
      HAVING COUNT(*) > 1
    `;
    checks.push({
      check: 'Duplicate Entry Numbers',
      status: duplicates.length === 0 ? 'PASS' : 'FAIL',
      details: duplicates.length === 0 ? 'No duplicates' : `${duplicates.length} duplicate numbers found`,
    });

    // 5. Accounts with no activity
    const inactiveAccounts = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      WHERE coa.organization_id = ${organizationId}::uuid
        AND coa.is_group = false
        AND coa.is_active = true
        AND jel.id IS NULL
        AND coa.opening_balance = 0
    `;
    const inactiveCount = Number(inactiveAccounts[0]?.count || 0);
    checks.push({
      check: 'Inactive Accounts',
      status: 'INFO',
      details: `${inactiveCount} active accounts with zero balance and no transactions`,
    });

    const allPassed = checks.every(c => c.status !== 'FAIL');

    return {
      organizationId,
      checks,
      overallStatus: allPassed ? 'HEALTHY' : 'ISSUES_FOUND',
      checkedAt: new Date().toISOString(),
    };
  }

  // ===== AUDIT TRAIL =====

  async getAuditTrail(
    organizationId: string,
    filters: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      fromDate?: string;
      toDate?: string;
      action?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.entityId ? { entityId: filters.entityId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.action ? { action: filters.action as Prisma.EnumAuditActionFilter } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
              ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
            },
          }
        : {}),
    };

    const page = filters.page || 1;
    const limit = filters.limit || 50;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createAuditEntry(
    organizationId: string,
    userId: string,
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    ipAddress?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        entityType,
        entityId,
        action,
        oldValues: oldValues ? oldValues as Prisma.InputJsonValue : undefined,
        newValues: newValues ? newValues as Prisma.InputJsonValue : undefined,
        ipAddress,
      },
    });
  }

  // ===== DATA IMPORT =====

  async importCustomers(
    organizationId: string,
    customers: { name: string; phone?: string; email?: string; address?: string; openingBalance?: number }[],
  ) {
    let imported = 0;
    let skipped = 0;
    for (const c of customers) {
      const existing = await this.prisma.customer.findFirst({
        where: { organizationId, name: c.name },
      });
      if (existing) { skipped++; continue; }
      await this.prisma.customer.create({
        data: {
          organizationId,
          name: c.name,
          phone: c.phone,
          email: c.email,
          address: c.address,
          openingBalance: c.openingBalance || 0,
        },
      });
      imported++;
    }
    return { imported, skipped, total: customers.length };
  }

  async importSuppliers(
    organizationId: string,
    suppliers: { name: string; phone?: string; email?: string; address?: string; openingBalance?: number }[],
  ) {
    let imported = 0;
    let skipped = 0;
    for (const s of suppliers) {
      const existing = await this.prisma.supplier.findFirst({
        where: { organizationId, name: s.name },
      });
      if (existing) { skipped++; continue; }
      await this.prisma.supplier.create({
        data: {
          organizationId,
          name: s.name,
          phone: s.phone,
          email: s.email,
          address: s.address,
          openingBalance: s.openingBalance || 0,
        },
      });
      imported++;
    }
    return { imported, skipped, total: suppliers.length };
  }

  async importItems(
    organizationId: string,
    items: { lotNumber: string; warehouseId: string; riceVarietyId: string; quantity: number; unit?: string; valuationRate?: number }[],
  ) {
    let imported = 0;
    let skipped = 0;
    for (const item of items) {
      const existing = await this.prisma.inventoryItem.findFirst({
        where: { organizationId, lotNumber: item.lotNumber },
      });
      if (existing) { skipped++; continue; }
      const quantity = new Prisma.Decimal(item.quantity);
      const rate = new Prisma.Decimal(item.valuationRate || 0);
      await this.prisma.inventoryItem.create({
        data: {
          organizationId,
          warehouseId: item.warehouseId,
          riceVarietyId: item.riceVarietyId,
          lotNumber: item.lotNumber,
          quantity,
          unit: item.unit || 'KG',
          valuationRate: rate,
          totalValue: quantity.mul(rate),
        },
      });
      imported++;
    }
    return { imported, skipped, total: items.length };
  }

  // ===== BACKUP INFO =====

  async getDatabaseStats(organizationId: string) {
    const [
      accountCount, jeCount, customerCount, supplierCount, employeeCount,
      invoiceCount, poCount, itemCount, productionCount,
    ] = await Promise.all([
      this.prisma.chartOfAccount.count({ where: { organizationId } }),
      this.prisma.journalEntry.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.customer.count({ where: { organizationId } }),
      this.prisma.supplier.count({ where: { organizationId } }),
      this.prisma.employee.count({ where: { organizationId } }),
      this.prisma.salesInvoice.count({ where: { organizationId } }),
      this.prisma.purchaseOrder.count({ where: { organizationId } }),
      this.prisma.inventoryItem.count({ where: { organizationId } }),
      this.prisma.productionBatch.count({ where: { organizationId } }),
    ]);

    return {
      accounts: accountCount,
      journalEntries: jeCount,
      customers: customerCount,
      suppliers: supplierCount,
      employees: employeeCount,
      salesInvoices: invoiceCount,
      purchaseOrders: poCount,
      inventoryItems: itemCount,
      productionBatches: productionCount,
      lastChecked: new Date().toISOString(),
    };
  }
}
