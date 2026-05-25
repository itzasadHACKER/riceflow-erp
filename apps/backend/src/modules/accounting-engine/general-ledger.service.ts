import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  PostToLedgerDto,
  GLEntryLineDto,
  GLReportFilterDto,
  BalanceSheetFilterDto,
  ProfitLossFilterDto,
  AgingFilterDto,
} from './dto/gl-entry.dto';

@Injectable()
export class GeneralLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // CORE: Post to General Ledger (centralized — ALL modules call this)
  // =========================================================================

  async postToLedger(
    organizationId: string,
    userId: string,
    dto: PostToLedgerDto,
  ) {
    // 1. Validate balanced entries
    this.validateBalancedEntries(dto.entries);

    // 2. Validate posting period
    const postingDate = new Date(dto.postingDate);
    await this.validatePostingPeriod(organizationId, postingDate);

    // 3. Get fiscal year
    const fiscalYear = await this.getActiveFiscalYearForDate(organizationId, postingDate);

    // 4. Validate all accounts exist and are not frozen/group
    const accountIds = dto.entries.map(e => e.accountId);
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds }, organizationId },
    });

    const accountMap = new Map(accounts.map(a => [a.id, a]));
    for (const entry of dto.entries) {
      const account = accountMap.get(entry.accountId);
      if (!account) {
        throw new BadRequestException(`Account ${entry.accountId} not found`);
      }
      if (account.isGroup) {
        throw new BadRequestException(
          `Cannot post to group account "${account.name}" (${account.code}). Select a ledger account.`,
        );
      }
      if (account.isFrozen) {
        throw new ForbiddenException(
          `Account "${account.name}" (${account.code}) is frozen. Cannot post.`,
        );
      }
      if (!account.isActive) {
        throw new BadRequestException(
          `Account "${account.name}" (${account.code}) is inactive.`,
        );
      }
    }

    // 5. Validate cost center requirements
    for (const entry of dto.entries) {
      const account = accountMap.get(entry.accountId)!;
      if (account.mandatoryCostCenter && !entry.costCenterId) {
        throw new BadRequestException(
          `Cost center is mandatory for account "${account.name}" (${account.code})`,
        );
      }
    }

    // 6. Create GL entries in transaction
    return this.prisma.$transaction(async (tx) => {
      const glEntries = [];

      for (const entry of dto.entries) {
        const account = accountMap.get(entry.accountId)!;

        if (entry.debit === 0 && entry.credit === 0) continue;

        const glEntry = await tx.generalLedgerEntry.create({
          data: {
            organizationId,
            postingDate,
            accountId: entry.accountId,
            accountCode: account.code,
            accountName: account.name,
            debit: entry.debit || 0,
            credit: entry.credit || 0,
            debitInAccountCurrency: entry.debitInAccountCurrency || entry.debit || 0,
            creditInAccountCurrency: entry.creditInAccountCurrency || entry.credit || 0,
            accountCurrency: entry.accountCurrency || account.currency || 'PKR',
            exchangeRate: entry.exchangeRate || 1,
            againstAccount: entry.againstAccount || this.buildAgainstAccount(dto.entries, entry),
            againstVoucherType: entry.againstVoucherType,
            againstVoucherId: entry.againstVoucherId,
            voucherType: dto.voucherType,
            voucherNo: dto.voucherNo,
            voucherId: dto.voucherId,
            journalEntryId: dto.journalEntryId,
            partyType: entry.partyType,
            partyId: entry.partyId,
            partyName: entry.partyName,
            costCenterId: entry.costCenterId || account.defaultCostCenterId,
            projectId: entry.projectId,
            fiscalYear: fiscalYear.name,
            isOpening: dto.isOpening || false,
            isAdvance: entry.isAdvance || false,
            remarks: entry.remarks || dto.remarks,
            createdBy: userId,
          },
        });
        glEntries.push(glEntry);
      }

      return {
        success: true,
        entriesCreated: glEntries.length,
        voucherType: dto.voucherType,
        voucherNo: dto.voucherNo,
        totalDebit: dto.entries.reduce((sum, e) => sum + (e.debit || 0), 0),
        totalCredit: dto.entries.reduce((sum, e) => sum + (e.credit || 0), 0),
        fiscalYear: fiscalYear.name,
        postingDate: dto.postingDate,
        glEntryIds: glEntries.map(g => g.id),
      };
    });
  }

  // =========================================================================
  // REVERSAL: Cancel GL entries by reversing (ERPNext/SAP immutable ledger)
  // =========================================================================

  async reverseLedgerEntries(
    organizationId: string,
    userId: string,
    voucherType: string,
    voucherNo: string,
    voucherId: string,
    reversalDate: string,
    remarks?: string,
  ) {
    const originalEntries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        organizationId,
        voucherType,
        voucherNo,
        isCancelled: false,
      },
    });

    if (originalEntries.length === 0) {
      throw new NotFoundException('No GL entries found for this voucher');
    }

    const postingDate = new Date(reversalDate);
    await this.validatePostingPeriod(organizationId, postingDate);
    const fiscalYear = await this.getActiveFiscalYearForDate(organizationId, postingDate);

    return this.prisma.$transaction(async (tx) => {
      // Mark original entries as cancelled
      await tx.generalLedgerEntry.updateMany({
        where: {
          organizationId,
          voucherType,
          voucherNo,
          isCancelled: false,
        },
        data: { isCancelled: true },
      });

      // Create reversal entries (debit↔credit swapped)
      const reversalEntries = [];
      for (const orig of originalEntries) {
        const reversal = await tx.generalLedgerEntry.create({
          data: {
            organizationId,
            postingDate,
            accountId: orig.accountId,
            accountCode: orig.accountCode,
            accountName: orig.accountName,
            debit: orig.credit,
            credit: orig.debit,
            debitInAccountCurrency: orig.creditInAccountCurrency,
            creditInAccountCurrency: orig.debitInAccountCurrency,
            accountCurrency: orig.accountCurrency,
            exchangeRate: orig.exchangeRate,
            againstAccount: orig.againstAccount,
            voucherType: `${voucherType}-REVERSAL`,
            voucherNo: `${voucherNo}-REV`,
            voucherId,
            journalEntryId: orig.journalEntryId,
            partyType: orig.partyType,
            partyId: orig.partyId,
            partyName: orig.partyName,
            costCenterId: orig.costCenterId,
            projectId: orig.projectId,
            fiscalYear: fiscalYear.name,
            remarks: remarks || `Reversal of ${voucherNo}`,
            createdBy: userId,
          },
        });
        reversalEntries.push(reversal);
      }

      return {
        success: true,
        originalEntriesCancelled: originalEntries.length,
        reversalEntriesCreated: reversalEntries.length,
        reversalDate,
      };
    });
  }

  // =========================================================================
  // REPORTS: General Ledger Report
  // =========================================================================

  async getGeneralLedgerReport(
    organizationId: string,
    filters: GLReportFilterDto,
  ) {
    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      ...(filters.includeCancelled ? {} : { isCancelled: false }),
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(filters.partyType ? { partyType: filters.partyType } : {}),
      ...(filters.partyId ? { partyId: filters.partyId } : {}),
      ...(filters.costCenterId ? { costCenterId: filters.costCenterId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.voucherType ? { voucherType: filters.voucherType } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            postingDate: {
              ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
              ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
            },
          }
        : {}),
    };

    const entries = await this.prisma.generalLedgerEntry.findMany({
      where,
      orderBy: [{ postingDate: 'asc' }, { createdAt: 'asc' }],
    });

    // Calculate running balance per account
    const balanceMap = new Map<string, number>();
    const enrichedEntries = entries.map(entry => {
      const key = entry.accountId;
      const prev = balanceMap.get(key) || 0;
      const balance = prev + Number(entry.debit) - Number(entry.credit);
      balanceMap.set(key, balance);
      return { ...entry, runningBalance: balance };
    });

    const totals = entries.reduce(
      (acc, e) => ({
        totalDebit: acc.totalDebit + Number(e.debit),
        totalCredit: acc.totalCredit + Number(e.credit),
      }),
      { totalDebit: 0, totalCredit: 0 },
    );

    return {
      entries: enrichedEntries,
      ...totals,
      difference: totals.totalDebit - totals.totalCredit,
      isBalanced: Math.abs(totals.totalDebit - totals.totalCredit) < 0.0001,
      entryCount: entries.length,
    };
  }

  // =========================================================================
  // REPORTS: Trial Balance (from GL entries)
  // =========================================================================

  async getTrialBalance(
    organizationId: string,
    fiscalYear?: string,
    asOfDate?: string,
    costCenterId?: string,
  ) {
    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      isCancelled: false,
      ...(fiscalYear ? { fiscalYear } : {}),
      ...(asOfDate ? { postingDate: { lte: new Date(asOfDate) } } : {}),
      ...(costCenterId ? { costCenterId } : {}),
    };

    const result = await this.prisma.generalLedgerEntry.groupBy({
      by: ['accountId', 'accountCode', 'accountName'],
      where,
      _sum: { debit: true, credit: true },
      orderBy: { accountCode: 'asc' },
    });

    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: 'asc' },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = result.map(row => {
      const account = accountMap.get(row.accountId);
      const debit = Number(row._sum.debit) || 0;
      const credit = Number(row._sum.credit) || 0;
      const opening = account ? Number(account.openingBalance) : 0;

      let closingDebit = 0;
      let closingCredit = 0;

      if (account?.balanceType === 'DEBIT') {
        const balance = opening + debit - credit;
        if (balance >= 0) closingDebit = balance;
        else closingCredit = Math.abs(balance);
      } else {
        const balance = opening + credit - debit;
        if (balance >= 0) closingCredit = balance;
        else closingDebit = Math.abs(balance);
      }

      totalDebit += closingDebit;
      totalCredit += closingCredit;

      return {
        accountId: row.accountId,
        accountCode: row.accountCode,
        accountName: row.accountName,
        accountType: account?.accountType,
        openingBalance: opening,
        debit,
        credit,
        closingDebit,
        closingCredit,
        closingBalance: closingDebit - closingCredit,
      };
    });

    return {
      rows,
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.0001,
      generatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // REPORTS: Balance Sheet (Assets = Liabilities + Equity)
  // =========================================================================

  async getBalanceSheet(
    organizationId: string,
    filters: BalanceSheetFilterDto,
  ) {
    const asOfDate = filters.asOfDate || new Date().toISOString().split('T')[0];

    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      isCancelled: false,
      postingDate: { lte: new Date(asOfDate) },
      ...(filters.costCenterId ? { costCenterId: filters.costCenterId } : {}),
    };

    const result = await this.prisma.generalLedgerEntry.groupBy({
      by: ['accountId', 'accountCode', 'accountName'],
      where,
      _sum: { debit: true, credit: true },
    });

    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        isActive: true,
        accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
      },
      include: { parent: true },
      orderBy: { code: 'asc' },
    });

    const glMap = new Map(result.map(r => [r.accountId, r]));
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const assets: Array<Record<string, unknown>> = [];
    const liabilities: Array<Record<string, unknown>> = [];
    const equity: Array<Record<string, unknown>> = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const account of accounts) {
      if (account.isGroup) continue;

      const gl = glMap.get(account.id);
      const debit = gl ? Number(gl._sum.debit) : 0;
      const credit = gl ? Number(gl._sum.credit) : 0;
      const opening = Number(account.openingBalance);

      let balance: number;
      if (account.balanceType === 'DEBIT') {
        balance = opening + debit - credit;
      } else {
        balance = opening + credit - debit;
      }

      if (balance === 0) continue;

      const row = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        parentAccount: account.parent?.name,
        balance,
      };

      if (account.accountType === 'ASSET') {
        assets.push(row);
        totalAssets += balance;
      } else if (account.accountType === 'LIABILITY') {
        liabilities.push(row);
        totalLiabilities += balance;
      } else {
        equity.push(row);
        totalEquity += balance;
      }
    }

    // Add net income/loss to equity
    const netIncome = await this.getNetIncome(organizationId, asOfDate, filters.costCenterId);
    if (Math.abs(netIncome) > 0.0001) {
      equity.push({
        accountCode: 'NET-INCOME',
        accountName: 'Net Income (Current Period)',
        balance: netIncome,
      });
      totalEquity += netIncome;
    }

    return {
      asOfDate,
      assets: { items: assets, total: totalAssets },
      liabilities: { items: liabilities, total: totalLiabilities },
      equity: { items: equity, total: totalEquity },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      difference: totalAssets - (totalLiabilities + totalEquity),
      generatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // REPORTS: Profit & Loss Statement
  // =========================================================================

  async getProfitAndLoss(
    organizationId: string,
    filters: ProfitLossFilterDto,
  ) {
    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      isCancelled: false,
      postingDate: {
        gte: new Date(filters.fromDate),
        lte: new Date(filters.toDate),
      },
      ...(filters.costCenterId ? { costCenterId: filters.costCenterId } : {}),
    };

    const result = await this.prisma.generalLedgerEntry.groupBy({
      by: ['accountId', 'accountCode', 'accountName'],
      where,
      _sum: { debit: true, credit: true },
    });

    const accounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        isActive: true,
        accountType: { in: ['REVENUE', 'INCOME', 'EXPENSE'] },
      },
      include: { parent: true },
      orderBy: { code: 'asc' },
    });

    const glMap = new Map(result.map(r => [r.accountId, r]));

    const income: Array<Record<string, unknown>> = [];
    const expenses: Array<Record<string, unknown>> = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      if (account.isGroup) continue;

      const gl = glMap.get(account.id);
      if (!gl) continue;

      const debit = Number(gl._sum.debit) || 0;
      const credit = Number(gl._sum.credit) || 0;

      let amount: number;
      if (account.accountType === 'REVENUE' || account.accountType === 'INCOME') {
        amount = credit - debit;
        if (Math.abs(amount) > 0.0001) {
          income.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            parentAccount: account.parent?.name,
            amount,
          });
          totalIncome += amount;
        }
      } else {
        amount = debit - credit;
        if (Math.abs(amount) > 0.0001) {
          expenses.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            parentAccount: account.parent?.name,
            amount,
          });
          totalExpenses += amount;
        }
      }
    }

    return {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      income: { items: income, total: totalIncome },
      expenses: { items: expenses, total: totalExpenses },
      netProfit: totalIncome - totalExpenses,
      grossMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
      generatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // REPORTS: Accounts Receivable / Payable Aging
  // =========================================================================

  async getAgingReport(organizationId: string, filters: AgingFilterDto) {
    const asOfDate = filters.asOfDate ? new Date(filters.asOfDate) : new Date();
    const isReceivable = filters.partyType === 'CUSTOMER';

    const accountSubType = isReceivable ? 'ACCOUNTS_RECEIVABLE' : 'ACCOUNTS_PAYABLE';
    const receivableAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountSubType, isActive: true },
    });

    if (receivableAccounts.length === 0) {
      return { rows: [], totals: { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 } };
    }

    const entries = await this.prisma.generalLedgerEntry.findMany({
      where: {
        organizationId,
        accountId: { in: receivableAccounts.map(a => a.id) },
        isCancelled: false,
        postingDate: { lte: asOfDate },
        ...(filters.partyId ? { partyId: filters.partyId } : {}),
        ...(filters.partyType ? { partyType: filters.partyType } : {}),
      },
      orderBy: { postingDate: 'asc' },
    });

    // Group by party
    const partyMap = new Map<string, { partyId: string; partyName: string; entries: typeof entries }>();
    for (const entry of entries) {
      const key = entry.partyId || 'UNKNOWN';
      if (!partyMap.has(key)) {
        partyMap.set(key, { partyId: key, partyName: entry.partyName || 'Unknown', entries: [] });
      }
      partyMap.get(key)!.entries.push(entry);
    }

    const rows = [];
    const totals = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0, total: 0 };

    for (const [, party] of partyMap) {
      let outstanding = 0;
      for (const e of party.entries) {
        outstanding += isReceivable
          ? Number(e.debit) - Number(e.credit)
          : Number(e.credit) - Number(e.debit);
      }

      if (Math.abs(outstanding) < 0.01) continue;

      // Calculate aging buckets from oldest uncleared entry
      const oldestEntry = party.entries[0];
      const daysDiff = Math.floor(
        (asOfDate.getTime() - new Date(oldestEntry.postingDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      const bucket = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
      if (daysDiff <= 30) bucket.current = outstanding;
      else if (daysDiff <= 60) bucket.days30 = outstanding;
      else if (daysDiff <= 90) bucket.days60 = outstanding;
      else if (daysDiff <= 120) bucket.days90 = outstanding;
      else bucket.over90 = outstanding;

      rows.push({
        partyId: party.partyId,
        partyName: party.partyName,
        ...bucket,
        total: outstanding,
      });

      totals.current += bucket.current;
      totals.days30 += bucket.days30;
      totals.days60 += bucket.days60;
      totals.days90 += bucket.days90;
      totals.over90 += bucket.over90;
      totals.total += outstanding;
    }

    return {
      partyType: filters.partyType,
      asOfDate: asOfDate.toISOString().split('T')[0],
      rows: rows.sort((a, b) => b.total - a.total),
      totals,
      generatedAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // ACCOUNT BALANCE: Get balance of any account from GL
  // =========================================================================

  async getAccountBalanceFromGL(
    organizationId: string,
    accountId: string,
    asOfDate?: string,
    costCenterId?: string,
  ) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: accountId, organizationId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      accountId,
      isCancelled: false,
      ...(asOfDate ? { postingDate: { lte: new Date(asOfDate) } } : {}),
      ...(costCenterId ? { costCenterId } : {}),
    };

    const result = await this.prisma.generalLedgerEntry.aggregate({
      where,
      _sum: { debit: true, credit: true },
    });

    const totalDebit = Number(result._sum.debit) || 0;
    const totalCredit = Number(result._sum.credit) || 0;
    const opening = Number(account.openingBalance);

    let balance: number;
    if (account.balanceType === 'DEBIT') {
      balance = opening + totalDebit - totalCredit;
    } else {
      balance = opening + totalCredit - totalDebit;
    }

    return {
      accountId,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      balanceType: account.balanceType,
      openingBalance: opening,
      totalDebit,
      totalCredit,
      closingBalance: balance,
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    };
  }

  // =========================================================================
  // PARTY OUTSTANDING: Get outstanding for a customer/supplier from GL
  // =========================================================================

  async getPartyOutstanding(
    organizationId: string,
    partyType: string,
    partyId: string,
    asOfDate?: string,
  ) {
    const subType = partyType === 'CUSTOMER' ? 'ACCOUNTS_RECEIVABLE' : 'ACCOUNTS_PAYABLE';

    const receivableAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountSubType: subType, isActive: true },
    });

    if (receivableAccounts.length === 0) return { outstanding: 0 };

    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      accountId: { in: receivableAccounts.map(a => a.id) },
      partyType,
      partyId,
      isCancelled: false,
      ...(asOfDate ? { postingDate: { lte: new Date(asOfDate) } } : {}),
    };

    const result = await this.prisma.generalLedgerEntry.aggregate({
      where,
      _sum: { debit: true, credit: true },
    });

    const debit = Number(result._sum.debit) || 0;
    const credit = Number(result._sum.credit) || 0;

    const outstanding = partyType === 'CUSTOMER' ? debit - credit : credit - debit;

    return {
      partyType,
      partyId,
      outstanding,
      totalDebit: debit,
      totalCredit: credit,
    };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private validateBalancedEntries(entries: GLEntryLineDto[]) {
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.0001) {
      throw new BadRequestException(
        `Unbalanced entry: Total Debit (${totalDebit.toFixed(4)}) != Total Credit (${totalCredit.toFixed(4)}). Difference: ${difference.toFixed(4)}. All journal entries must balance.`,
      );
    }

    if (totalDebit === 0 && totalCredit === 0) {
      throw new BadRequestException('At least one entry must have a non-zero debit or credit amount.');
    }

    for (const entry of entries) {
      if ((entry.debit || 0) < 0 || (entry.credit || 0) < 0) {
        throw new BadRequestException('Debit and credit amounts must not be negative.');
      }
      if ((entry.debit || 0) > 0 && (entry.credit || 0) > 0) {
        throw new BadRequestException(
          'An entry line cannot have both debit and credit. Split into separate lines.',
        );
      }
    }
  }

  private async validatePostingPeriod(organizationId: string, date: Date) {
    // Check accounting period is not closed
    const closedPeriod = await this.prisma.accountingPeriod.findFirst({
      where: {
        organizationId,
        isClosed: true,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (closedPeriod) {
      throw new ForbiddenException(
        `Accounting period "${closedPeriod.periodName}" (${closedPeriod.startDate.toISOString().split('T')[0]} to ${closedPeriod.endDate.toISOString().split('T')[0]}) is closed. Cannot post.`,
      );
    }

    // Check fiscal year exists and is active
    const fy = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });

    if (!fy) {
      throw new BadRequestException(
        `No fiscal year covers the date ${date.toISOString().split('T')[0]}. Create a fiscal year first.`,
      );
    }

    if (!fy.isActive) {
      throw new ForbiddenException(
        `Fiscal year "${fy.name}" is locked/inactive. Cannot post.`,
      );
    }
  }

  private async getActiveFiscalYearForDate(organizationId: string, date: Date) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: date },
        endDate: { gte: date },
        isActive: true,
      },
    });

    if (!fy) {
      throw new BadRequestException(
        `No active fiscal year found for date ${date.toISOString().split('T')[0]}`,
      );
    }

    return fy;
  }

  private buildAgainstAccount(entries: GLEntryLineDto[], currentEntry: GLEntryLineDto): string {
    const isDebit = (currentEntry.debit || 0) > 0;
    const opposites = entries.filter(e =>
      isDebit ? (e.credit || 0) > 0 : (e.debit || 0) > 0,
    );
    return opposites.map(e => e.accountId).join(', ');
  }

  private async getNetIncome(
    organizationId: string,
    asOfDate: string,
    costCenterId?: string,
  ): Promise<number> {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: new Date(asOfDate) },
        endDate: { gte: new Date(asOfDate) },
      },
    });

    if (!fy) return 0;

    const where: Prisma.GeneralLedgerEntryWhereInput = {
      organizationId,
      isCancelled: false,
      postingDate: {
        gte: fy.startDate,
        lte: new Date(asOfDate),
      },
      ...(costCenterId ? { costCenterId } : {}),
    };

    // Revenue
    const revenueAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: { in: ['REVENUE', 'INCOME'] }, isGroup: false },
    });
    const revenueResult = await this.prisma.generalLedgerEntry.aggregate({
      where: { ...where, accountId: { in: revenueAccounts.map(a => a.id) } },
      _sum: { debit: true, credit: true },
    });
    const revenue = (Number(revenueResult._sum.credit) || 0) - (Number(revenueResult._sum.debit) || 0);

    // Expenses
    const expenseAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'EXPENSE', isGroup: false },
    });
    const expenseResult = await this.prisma.generalLedgerEntry.aggregate({
      where: { ...where, accountId: { in: expenseAccounts.map(a => a.id) } },
      _sum: { debit: true, credit: true },
    });
    const expenses = (Number(expenseResult._sum.debit) || 0) - (Number(expenseResult._sum.credit) || 0);

    return revenue - expenses;
  }
}
