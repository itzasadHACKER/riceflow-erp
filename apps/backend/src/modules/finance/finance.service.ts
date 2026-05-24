import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateFiscalYearDto,
  UpdateFiscalYearDto,
} from './dto/fiscal-year.dto';
import {
  CreateChartOfAccountDto,
  UpdateChartOfAccountDto,
} from './dto/chart-of-account.dto';
import {
  CreateJournalEntryDto,
  JournalEntryFilterDto,
} from './dto/journal-entry.dto';
import {
  CreatePaymentVoucherDto,
  CreateReceiptVoucherDto,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  CreateTaxConfigDto,
  CreateExpenseClaimDto,
  LedgerFilterDto,
  TrialBalanceFilterDto,
} from './dto/voucher.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== FISCAL YEAR =====

  async createFiscalYear(organizationId: string, dto: CreateFiscalYearDto) {
    const overlap = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        OR: [
          {
            startDate: { lte: new Date(dto.endDate) },
            endDate: { gte: new Date(dto.startDate) },
          },
        ],
      },
    });
    if (overlap) {
      throw new ConflictException(
        'Fiscal year dates overlap with an existing fiscal year',
      );
    }
    return this.prisma.fiscalYear.create({
      data: {
        organizationId,
        name: dto.name,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async listFiscalYears(organizationId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getFiscalYear(organizationId: string, id: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id, organizationId },
    });
    if (!fy) throw new NotFoundException('Fiscal year not found');
    return fy;
  }

  async updateFiscalYear(
    organizationId: string,
    id: string,
    dto: UpdateFiscalYearDto,
  ) {
    await this.getFiscalYear(organizationId, id);
    return this.prisma.fiscalYear.update({
      where: { id },
      data: dto,
    });
  }

  async getActiveFiscalYear(organizationId: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { organizationId, isActive: true, isClosed: false },
      orderBy: { startDate: 'desc' },
    });
    if (!fy) throw new NotFoundException('No active fiscal year found');
    return fy;
  }

  // ===== CHART OF ACCOUNTS =====

  async createAccount(organizationId: string, dto: CreateChartOfAccountDto) {
    const existing = await this.prisma.chartOfAccount.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing)
      throw new ConflictException(`Account code ${dto.code} already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.chartOfAccount.findFirst({
        where: { id: dto.parentId, organizationId },
      });
      if (!parent) throw new NotFoundException('Parent account not found');
      if (!parent.isGroup)
        throw new BadRequestException('Parent account must be a group account');
    }

    return this.prisma.chartOfAccount.create({
      data: {
        organizationId,
        code: dto.code,
        name: dto.name,
        accountType: dto.accountType,
        balanceType: dto.balanceType,
        parentId: dto.parentId,
        isGroup: dto.isGroup ?? false,
        openingBalance: dto.openingBalance ?? 0,
        description: dto.description,
      },
    });
  }

  async listAccounts(organizationId: string) {
    return this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
      include: { children: { where: { isActive: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async getAccountTree(organizationId: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: 'asc' },
    });

    const accountMap = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    for (const acc of accounts) {
      accountMap.set(acc.id, { ...acc, children: [] });
    }

    for (const acc of accounts) {
      const node = accountMap.get(acc.id)!;
      if (acc.parentId && accountMap.has(acc.parentId)) {
        const parent = accountMap.get(acc.parentId)!;
        (parent.children as Record<string, unknown>[]).push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getAccount(organizationId: string, id: string) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id, organizationId },
      include: { parent: true, children: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateAccount(
    organizationId: string,
    id: string,
    dto: UpdateChartOfAccountDto,
  ) {
    const account = await this.getAccount(organizationId, id);
    if (account.isSystem)
      throw new BadRequestException('Cannot modify system accounts');
    return this.prisma.chartOfAccount.update({
      where: { id },
      data: dto,
    });
  }

  async seedDefaultAccounts(organizationId: string) {
    const existing = await this.prisma.chartOfAccount.count({
      where: { organizationId },
    });
    if (existing > 0)
      throw new ConflictException('Chart of accounts already has entries');

    const defaults = [
      {
        code: '1000',
        name: 'Assets',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
      },
      {
        code: '1100',
        name: 'Current Assets',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
        parentCode: '1000',
      },
      {
        code: '1110',
        name: 'Cash in Hand',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1100',
        isSystem: true,
      },
      {
        code: '1120',
        name: 'Bank Accounts',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
        parentCode: '1100',
      },
      {
        code: '1130',
        name: 'Accounts Receivable',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1100',
        isSystem: true,
      },
      {
        code: '1140',
        name: 'Inventory',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1100',
        isSystem: true,
      },
      {
        code: '1150',
        name: 'Advance to Suppliers',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1100',
      },
      {
        code: '1200',
        name: 'Fixed Assets',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
        parentCode: '1000',
      },
      {
        code: '1210',
        name: 'Land & Building',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1200',
      },
      {
        code: '1220',
        name: 'Plant & Machinery',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1200',
      },
      {
        code: '1230',
        name: 'Vehicles',
        accountType: 'ASSET' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '1200',
      },
      {
        code: '2000',
        name: 'Liabilities',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: true,
      },
      {
        code: '2100',
        name: 'Current Liabilities',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: true,
        parentCode: '2000',
      },
      {
        code: '2110',
        name: 'Accounts Payable',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '2100',
        isSystem: true,
      },
      {
        code: '2120',
        name: 'Advance from Customers',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '2100',
      },
      {
        code: '2130',
        name: 'GST Payable',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '2100',
        isSystem: true,
      },
      {
        code: '2140',
        name: 'Salaries Payable',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '2100',
        isSystem: true,
      },
      {
        code: '2200',
        name: 'Long Term Liabilities',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: true,
        parentCode: '2000',
      },
      {
        code: '2210',
        name: 'Bank Loans',
        accountType: 'LIABILITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '2200',
      },
      {
        code: '3000',
        name: 'Equity',
        accountType: 'EQUITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: true,
      },
      {
        code: '3100',
        name: 'Owner Capital',
        accountType: 'EQUITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '3000',
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        accountType: 'EQUITY' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '3000',
        isSystem: true,
      },
      {
        code: '4000',
        name: 'Revenue',
        accountType: 'REVENUE' as const,
        balanceType: 'CREDIT' as const,
        isGroup: true,
      },
      {
        code: '4100',
        name: 'Sales Revenue',
        accountType: 'REVENUE' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '4000',
        isSystem: true,
      },
      {
        code: '4200',
        name: 'Commission Income',
        accountType: 'REVENUE' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '4000',
      },
      {
        code: '4300',
        name: 'Other Income',
        accountType: 'REVENUE' as const,
        balanceType: 'CREDIT' as const,
        isGroup: false,
        parentCode: '4000',
      },
      {
        code: '5000',
        name: 'Expenses',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
      },
      {
        code: '5100',
        name: 'Cost of Goods Sold',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
        parentCode: '5000',
      },
      {
        code: '5110',
        name: 'Paddy Purchase Cost',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5100',
        isSystem: true,
      },
      {
        code: '5120',
        name: 'Milling Cost',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5100',
      },
      {
        code: '5130',
        name: 'Freight & Transport',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5100',
      },
      {
        code: '5200',
        name: 'Operating Expenses',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: true,
        parentCode: '5000',
      },
      {
        code: '5210',
        name: 'Salary Expense',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
        isSystem: true,
      },
      {
        code: '5220',
        name: 'Rent Expense',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
      {
        code: '5230',
        name: 'Utility Expense',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
      {
        code: '5240',
        name: 'Depreciation',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
      {
        code: '5250',
        name: 'Office Expenses',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
      {
        code: '5260',
        name: 'Commission Expense',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
      {
        code: '5270',
        name: 'Miscellaneous Expense',
        accountType: 'EXPENSE' as const,
        balanceType: 'DEBIT' as const,
        isGroup: false,
        parentCode: '5200',
      },
    ];

    return this.prisma.$transaction(async (tx) => {
      const codeToId = new Map<string, string>();

      for (const acc of defaults) {
        const parentId = acc.parentCode
          ? codeToId.get(acc.parentCode)
          : undefined;
        const created = await tx.chartOfAccount.create({
          data: {
            organizationId,
            code: acc.code,
            name: acc.name,
            accountType: acc.accountType,
            balanceType: acc.balanceType,
            isGroup: acc.isGroup,
            isSystem: acc.isSystem ?? false,
            parentId: parentId ?? null,
          },
        });
        codeToId.set(acc.code, created.id);
      }

      return { count: defaults.length };
    });
  }

  // ===== JOURNAL ENTRIES =====

  async createJournalEntry(
    organizationId: string,
    userId: string,
    dto: CreateJournalEntryDto,
  ) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least 2 lines');
    }

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);
    for (const line of dto.lines) {
      totalDebit = totalDebit.add(new Prisma.Decimal(line.debit));
      totalCredit = totalCredit.add(new Prisma.Decimal(line.credit));
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new BadRequestException(
        `Total debits (${totalDebit.toString()}) must equal total credits (${totalCredit.toString()})`,
      );
    }

    if (totalDebit.equals(new Prisma.Decimal(0))) {
      throw new BadRequestException('Journal entry amounts cannot all be zero');
    }

    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException(
          'A journal entry line cannot have both debit and credit amounts',
        );
      }
    }

    await this.getFiscalYear(organizationId, dto.fiscalYearId);

    const accountIds = dto.lines.map((l) => l.accountId);
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { id: { in: accountIds }, organizationId, isActive: true },
    });
    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more account IDs are invalid');
    }

    const groupAccounts = accounts.filter((a) => a.isGroup);
    if (groupAccounts.length > 0) {
      throw new BadRequestException(
        `Cannot post to group accounts: ${groupAccounts.map((a) => a.code).join(', ')}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const entryNumber = await this.generateEntryNumber(tx, organizationId);

      const entry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(dto.date),
          reference: dto.reference,
          narration: dto.narration,
          entryType: dto.entryType ?? 'MANUAL',
          fiscalYearId: dto.fiscalYearId,
          createdBy: userId,
          lines: {
            create: dto.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              narration: line.narration,
              costCenter: line.costCenter,
            })),
          },
        },
        include: {
          lines: { include: { account: true } },
          fiscalYear: true,
        },
      });

      return entry;
    });
  }

  async postJournalEntry(organizationId: string, userId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { lines: true },
    });

    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.isPosted)
      throw new BadRequestException('Journal entry is already posted');

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        isPosted: true,
        postedBy: userId,
        postedAt: new Date(),
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async listJournalEntries(
    organizationId: string,
    filter: JournalEntryFilterDto,
    page: number = 1,
    limit: number = 20,
  ) {
    const where: Prisma.JournalEntryWhereInput = {
      organizationId,
      deletedAt: null,
    };

    if (filter.fromDate) where.date = { gte: new Date(filter.fromDate) };
    if (filter.toDate) {
      where.date = {
        ...(where.date as Prisma.DateTimeFilter),
        lte: new Date(filter.toDate),
      };
    }
    if (filter.fiscalYearId) where.fiscalYearId = filter.fiscalYearId;
    if (filter.entryType) where.entryType = filter.entryType;
    if (filter.isPosted !== undefined) where.isPosted = filter.isPosted;

    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        include: {
          lines: { include: { account: true } },
          fiscalYear: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getJournalEntry(organizationId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        lines: { include: { account: true } },
        fiscalYear: true,
      },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  // ===== GENERAL LEDGER =====

  async getGeneralLedger(organizationId: string, filter: LedgerFilterDto) {
    const account = await this.getAccount(organizationId, filter.accountId);

    const where: Prisma.JournalEntryLineWhereInput = {
      accountId: filter.accountId,
      journalEntry: {
        organizationId,
        isPosted: true,
        deletedAt: null,
      },
    };

    if (filter.fromDate || filter.toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (filter.fromDate) dateFilter.gte = new Date(filter.fromDate);
      if (filter.toDate) dateFilter.lte = new Date(filter.toDate);
      where.journalEntry = {
        ...(where.journalEntry as Prisma.JournalEntryWhereInput),
        date: dateFilter,
      };
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: {
        journalEntry: {
          select: {
            entryNumber: true,
            date: true,
            narration: true,
            reference: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    let runningBalance = Number(account.openingBalance);
    const ledgerEntries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      if (account.balanceType === 'DEBIT') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }
      return {
        id: line.id,
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        reference: line.journalEntry.reference,
        narration: line.narration ?? line.journalEntry.narration,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return {
      account: { id: account.id, code: account.code, name: account.name },
      openingBalance: Number(account.openingBalance),
      entries: ledgerEntries,
      closingBalance: runningBalance,
    };
  }

  // ===== TRIAL BALANCE =====

  async getTrialBalance(organizationId: string, filter: TrialBalanceFilterDto) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true, isGroup: false },
      orderBy: { code: 'asc' },
    });

    const dateFilter: Prisma.DateTimeFilter = {};
    if (filter.asOfDate) dateFilter.lte = new Date(filter.asOfDate);

    const journalWhere: Prisma.JournalEntryWhereInput = {
      organizationId,
      isPosted: true,
      deletedAt: null,
    };
    if (filter.fiscalYearId) journalWhere.fiscalYearId = filter.fiscalYearId;
    if (filter.asOfDate) journalWhere.date = dateFilter;

    const aggregations = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: { journalEntry: journalWhere },
    });

    const aggMap = new Map<string, { debit: number; credit: number }>();
    for (const agg of aggregations) {
      aggMap.set(agg.accountId, {
        debit: Number(agg._sum.debit ?? 0),
        credit: Number(agg._sum.credit ?? 0),
      });
    }

    let totalDebit = 0;
    let totalCredit = 0;

    const rows = accounts.map((acc) => {
      const movements = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const opening = Number(acc.openingBalance);
      let debitBalance = 0;
      let creditBalance = 0;

      if (acc.balanceType === 'DEBIT') {
        const net = opening + movements.debit - movements.credit;
        if (net >= 0) debitBalance = net;
        else creditBalance = Math.abs(net);
      } else {
        const net = opening + movements.credit - movements.debit;
        if (net >= 0) creditBalance = net;
        else debitBalance = Math.abs(net);
      }

      totalDebit += debitBalance;
      totalCredit += creditBalance;

      return {
        accountId: acc.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        debit: debitBalance,
        credit: creditBalance,
      };
    });

    return {
      rows: rows.filter((r) => r.debit !== 0 || r.credit !== 0),
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ===== PROFIT & LOSS =====

  async getProfitAndLoss(
    organizationId: string,
    fromDate: string,
    toDate: string,
    fiscalYearId?: string,
  ) {
    const journalWhere: Prisma.JournalEntryWhereInput = {
      organizationId,
      isPosted: true,
      deletedAt: null,
      date: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;

    const revenueAccounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        accountType: 'REVENUE',
        isActive: true,
        isGroup: false,
      },
    });
    const expenseAccounts = await this.prisma.chartOfAccount.findMany({
      where: {
        organizationId,
        accountType: 'EXPENSE',
        isActive: true,
        isGroup: false,
      },
    });

    const revenueIds = revenueAccounts.map((a) => a.id);
    const expenseIds = expenseAccounts.map((a) => a.id);

    const aggregations = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: {
        accountId: { in: [...revenueIds, ...expenseIds] },
        journalEntry: journalWhere,
      },
    });

    const aggMap = new Map<string, { debit: number; credit: number }>();
    for (const agg of aggregations) {
      aggMap.set(agg.accountId, {
        debit: Number(agg._sum.debit ?? 0),
        credit: Number(agg._sum.credit ?? 0),
      });
    }

    let totalRevenue = 0;
    const revenueRows = revenueAccounts.map((acc) => {
      const movements = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const amount = movements.credit - movements.debit;
      totalRevenue += amount;
      return { code: acc.code, name: acc.name, amount };
    });

    let totalExpenses = 0;
    const expenseRows = expenseAccounts.map((acc) => {
      const movements = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const amount = movements.debit - movements.credit;
      totalExpenses += amount;
      return { code: acc.code, name: acc.name, amount };
    });

    return {
      period: { fromDate, toDate },
      revenue: {
        items: revenueRows.filter((r) => r.amount !== 0),
        total: totalRevenue,
      },
      expenses: {
        items: expenseRows.filter((r) => r.amount !== 0),
        total: totalExpenses,
      },
      netProfit: totalRevenue - totalExpenses,
    };
  }

  // ===== BALANCE SHEET =====

  async getBalanceSheet(
    organizationId: string,
    asOfDate: string,
    fiscalYearId?: string,
  ) {
    const journalWhere: Prisma.JournalEntryWhereInput = {
      organizationId,
      isPosted: true,
      deletedAt: null,
      date: { lte: new Date(asOfDate) },
    };
    if (fiscalYearId) journalWhere.fiscalYearId = fiscalYearId;

    const allAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isActive: true, isGroup: false },
    });

    const aggregations = await this.prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      _sum: { debit: true, credit: true },
      where: { journalEntry: journalWhere },
    });

    const aggMap = new Map<string, { debit: number; credit: number }>();
    for (const agg of aggregations) {
      aggMap.set(agg.accountId, {
        debit: Number(agg._sum.debit ?? 0),
        credit: Number(agg._sum.credit ?? 0),
      });
    }

    const calcBalance = (acc: {
      id: string;
      openingBalance: Prisma.Decimal;
      balanceType: string;
    }) => {
      const movements = aggMap.get(acc.id) ?? { debit: 0, credit: 0 };
      const opening = Number(acc.openingBalance);
      if (acc.balanceType === 'DEBIT')
        return opening + movements.debit - movements.credit;
      return opening + movements.credit - movements.debit;
    };

    const assets = allAccounts.filter((a) => a.accountType === 'ASSET');
    const liabilities = allAccounts.filter(
      (a) => a.accountType === 'LIABILITY',
    );
    const equity = allAccounts.filter((a) => a.accountType === 'EQUITY');

    let totalAssets = 0;
    const assetRows = assets.map((acc) => {
      const balance = calcBalance(acc);
      totalAssets += balance;
      return { code: acc.code, name: acc.name, balance };
    });

    let totalLiabilities = 0;
    const liabilityRows = liabilities.map((acc) => {
      const balance = calcBalance(acc);
      totalLiabilities += balance;
      return { code: acc.code, name: acc.name, balance };
    });

    let totalEquity = 0;
    const equityRows = equity.map((acc) => {
      const balance = calcBalance(acc);
      totalEquity += balance;
      return { code: acc.code, name: acc.name, balance };
    });

    return {
      asOfDate,
      assets: {
        items: assetRows.filter((r) => r.balance !== 0),
        total: totalAssets,
      },
      liabilities: {
        items: liabilityRows.filter((r) => r.balance !== 0),
        total: totalLiabilities,
      },
      equity: {
        items: equityRows.filter((r) => r.balance !== 0),
        total: totalEquity,
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced:
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  // ===== BANK ACCOUNTS =====

  async createBankAccount(organizationId: string, dto: CreateBankAccountDto) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: dto.accountId, organizationId },
    });
    if (!account)
      throw new NotFoundException('Linked chart of account not found');
    if (account.accountType !== 'ASSET') {
      throw new BadRequestException(
        'Bank account must be linked to an asset account',
      );
    }

    return this.prisma.bankAccount.create({
      data: {
        organizationId,
        accountName: dto.accountName,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        branchCode: dto.branchCode,
        iban: dto.iban,
        accountId: dto.accountId,
        openingBalance: dto.openingBalance ?? 0,
      },
    });
  }

  async listBankAccounts(organizationId: string) {
    return this.prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      include: { account: true },
      orderBy: { bankName: 'asc' },
    });
  }

  async updateBankAccount(
    organizationId: string,
    id: string,
    dto: UpdateBankAccountDto,
  ) {
    const ba = await this.prisma.bankAccount.findFirst({
      where: { id, organizationId },
    });
    if (!ba) throw new NotFoundException('Bank account not found');
    return this.prisma.bankAccount.update({ where: { id }, data: dto });
  }

  // ===== PAYMENT VOUCHERS =====

  async createPaymentVoucher(
    organizationId: string,
    userId: string,
    fiscalYearId: string,
    dto: CreatePaymentVoucherDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const voucherNumber = await this.generateVoucherNumber(
        tx,
        organizationId,
        'PV',
      );

      const isCash = String(dto.paymentMode) === 'CASH';
      const cashAccountCode = isCash ? '1110' : undefined;
      let payFromAccountId: string;

      if (cashAccountCode) {
        const cashAccount = await tx.chartOfAccount.findFirst({
          where: { organizationId, code: cashAccountCode },
        });
        if (!cashAccount)
          throw new NotFoundException('Cash account not found in COA');
        payFromAccountId = cashAccount.id;
      } else {
        if (!dto.bankAccountId)
          throw new BadRequestException(
            'Bank account is required for non-cash payments',
          );
        const bankAcc = await tx.bankAccount.findFirst({
          where: { id: dto.bankAccountId, organizationId },
        });
        if (!bankAcc) throw new NotFoundException('Bank account not found');
        payFromAccountId = bankAcc.accountId;
      }

      const payableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2110' },
      });
      if (!payableAccount)
        throw new NotFoundException('Accounts Payable not found in COA');

      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(dto.date),
          reference: dto.reference ?? voucherNumber,
          narration: dto.narration ?? `Payment to ${dto.partyType}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              { accountId: payableAccount.id, debit: dto.amount, credit: 0 },
              { accountId: payFromAccountId, debit: 0, credit: dto.amount },
            ],
          },
        },
      });

      return tx.paymentVoucher.create({
        data: {
          organizationId,
          voucherNumber,
          date: new Date(dto.date),
          partyType: dto.partyType,
          partyId: dto.partyId,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
          bankAccountId: dto.bankAccountId,
          chequeNumber: dto.chequeNumber,
          reference: dto.reference,
          narration: dto.narration,
          journalEntryId: journalEntry.id,
          status: 'POSTED',
          createdBy: userId,
        },
      });
    });
  }

  async listPaymentVouchers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.paymentVoucher.findMany({
        where: { organizationId },
        include: { bankAccount: true, journalEntry: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paymentVoucher.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  // ===== RECEIPT VOUCHERS =====

  async createReceiptVoucher(
    organizationId: string,
    userId: string,
    fiscalYearId: string,
    dto: CreateReceiptVoucherDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const voucherNumber = await this.generateVoucherNumber(
        tx,
        organizationId,
        'RV',
      );

      const isCash = String(dto.paymentMode) === 'CASH';
      const cashAccountCode = isCash ? '1110' : undefined;
      let receiveToAccountId: string;

      if (cashAccountCode) {
        const cashAccount = await tx.chartOfAccount.findFirst({
          where: { organizationId, code: cashAccountCode },
        });
        if (!cashAccount)
          throw new NotFoundException('Cash account not found in COA');
        receiveToAccountId = cashAccount.id;
      } else {
        if (!dto.bankAccountId)
          throw new BadRequestException(
            'Bank account is required for non-cash receipts',
          );
        const bankAcc = await tx.bankAccount.findFirst({
          where: { id: dto.bankAccountId, organizationId },
        });
        if (!bankAcc) throw new NotFoundException('Bank account not found');
        receiveToAccountId = bankAcc.accountId;
      }

      const receivableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1130' },
      });
      if (!receivableAccount)
        throw new NotFoundException('Accounts Receivable not found in COA');

      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(dto.date),
          reference: dto.reference ?? voucherNumber,
          narration: dto.narration ?? `Receipt from ${dto.partyType}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              { accountId: receiveToAccountId, debit: dto.amount, credit: 0 },
              { accountId: receivableAccount.id, debit: 0, credit: dto.amount },
            ],
          },
        },
      });

      return tx.receiptVoucher.create({
        data: {
          organizationId,
          voucherNumber,
          date: new Date(dto.date),
          partyType: dto.partyType,
          partyId: dto.partyId,
          amount: dto.amount,
          paymentMode: dto.paymentMode,
          bankAccountId: dto.bankAccountId,
          chequeNumber: dto.chequeNumber,
          reference: dto.reference,
          narration: dto.narration,
          journalEntryId: journalEntry.id,
          status: 'POSTED',
          createdBy: userId,
        },
      });
    });
  }

  async listReceiptVouchers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.receiptVoucher.findMany({
        where: { organizationId },
        include: { bankAccount: true, journalEntry: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.receiptVoucher.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  // ===== TAX CONFIGURATION =====

  async createTaxConfig(organizationId: string, dto: CreateTaxConfigDto) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: dto.accountId, organizationId },
    });
    if (!account) throw new NotFoundException('Tax account not found in COA');

    return this.prisma.taxConfiguration.create({
      data: {
        organizationId,
        name: dto.name,
        rate: dto.rate,
        taxType: dto.taxType,
        accountId: dto.accountId,
      },
    });
  }

  async listTaxConfigs(organizationId: string) {
    return this.prisma.taxConfiguration.findMany({
      where: { organizationId, isActive: true },
      include: { account: true },
    });
  }

  // ===== EXPENSE CLAIMS =====

  async createExpenseClaim(
    organizationId: string,
    userId: string,
    dto: CreateExpenseClaimDto,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const claimNumber = await this.generateClaimNumber(organizationId);

    return this.prisma.expenseClaim.create({
      data: {
        organizationId,
        employeeId: dto.employeeId,
        claimNumber,
        date: new Date(dto.date),
        totalAmount: dto.totalAmount,
        description: dto.description,
      },
      include: { employee: true },
    });
  }

  async approveExpenseClaim(
    organizationId: string,
    userId: string,
    id: string,
    fiscalYearId: string,
  ) {
    const claim = await this.prisma.expenseClaim.findFirst({
      where: { id, organizationId },
    });
    if (!claim) throw new NotFoundException('Expense claim not found');
    if (claim.status !== 'DRAFT')
      throw new BadRequestException('Only draft claims can be approved');

    return this.prisma.$transaction(async (tx) => {
      const expenseAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '5270' },
      });
      const payableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2110' },
      });

      if (!expenseAccount || !payableAccount) {
        throw new NotFoundException('Required accounts not found in COA');
      }

      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(claim.date),
          reference: claim.claimNumber,
          narration: `Expense claim ${claim.claimNumber}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: expenseAccount.id,
                debit: Number(claim.totalAmount),
                credit: 0,
              },
              {
                accountId: payableAccount.id,
                debit: 0,
                credit: Number(claim.totalAmount),
              },
            ],
          },
        },
      });

      return tx.expenseClaim.update({
        where: { id },
        data: {
          status: 'POSTED',
          approvedBy: userId,
          journalEntryId: journalEntry.id,
        },
        include: { employee: true },
      });
    });
  }

  async listExpenseClaims(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.expenseClaim.findMany({
        where: { organizationId },
        include: { employee: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expenseClaim.count({ where: { organizationId } }),
    ]);
    return { data, total, page, limit };
  }

  // ===== RECEIVABLES & PAYABLES =====

  async getReceivablesSummary(organizationId: string) {
    const receivableAccount = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId, code: '1130' },
    });
    if (!receivableAccount) return { total: 0, entries: [] };

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: receivableAccount.id,
        journalEntry: { organizationId, isPosted: true, deletedAt: null },
      },
      include: {
        journalEntry: {
          select: {
            entryNumber: true,
            date: true,
            reference: true,
            narration: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'desc' } },
    });

    let total = Number(receivableAccount.openingBalance);
    for (const line of lines) {
      total += Number(line.debit) - Number(line.credit);
    }

    return { total, accountCode: '1130', accountName: 'Accounts Receivable' };
  }

  async getPayablesSummary(organizationId: string) {
    const payableAccount = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId, code: '2110' },
    });
    if (!payableAccount) return { total: 0, entries: [] };

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: payableAccount.id,
        journalEntry: { organizationId, isPosted: true, deletedAt: null },
      },
      include: {
        journalEntry: {
          select: {
            entryNumber: true,
            date: true,
            reference: true,
            narration: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'desc' } },
    });

    let total = Number(payableAccount.openingBalance);
    for (const line of lines) {
      total += Number(line.credit) - Number(line.debit);
    }

    return { total, accountCode: '2110', accountName: 'Accounts Payable' };
  }

  // ===== HELPERS =====

  private async generateEntryNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.journalEntry.count({ where: { organizationId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateVoucherNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
    prefix: string,
  ): Promise<string> {
    if (prefix === 'PV') {
      const count = await tx.paymentVoucher.count({
        where: { organizationId },
      });
      return `PV-${String(count + 1).padStart(6, '0')}`;
    }
    const count = await tx.receiptVoucher.count({ where: { organizationId } });
    return `RV-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateClaimNumber(organizationId: string): Promise<string> {
    const count = await this.prisma.expenseClaim.count({
      where: { organizationId },
    });
    return `EC-${String(count + 1).padStart(6, '0')}`;
  }

  // ===== CREDIT NOTES =====

  async createCreditNote(
    organizationId: string,
    dto: {
      date: string;
      customerId: string;
      salesInvoiceId?: string;
      totalAmount: number;
      taxAmount?: number;
      netAmount: number;
      reason?: string;
      narration?: string;
    },
    createdBy?: string,
  ) {
    const count = await this.prisma.creditNote.count({
      where: { organizationId },
    });
    const noteNumber = `CN-${String(count + 1).padStart(6, '0')}`;
    return this.prisma.creditNote.create({
      data: {
        organizationId,
        noteNumber,
        date: new Date(dto.date),
        customerId: dto.customerId,
        salesInvoiceId: dto.salesInvoiceId,
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        taxAmount: new Prisma.Decimal(dto.taxAmount ?? 0),
        netAmount: new Prisma.Decimal(dto.netAmount),
        reason: dto.reason,
        narration: dto.narration,
        createdBy,
      },
    });
  }

  async getCreditNotes(
    organizationId: string,
    filter: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.CreditNoteWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filter.status)
      where.status = filter.status as 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.creditNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, salesInvoice: true },
      }),
      this.prisma.creditNote.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async confirmCreditNote(
    organizationId: string,
    id: string,
    fiscalYearId: string,
  ) {
    const note = await this.prisma.creditNote.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { customer: true },
    });
    if (!note) throw new NotFoundException('Credit note not found');
    if (note.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT notes can be confirmed');
    }

    return this.prisma.$transaction(async (tx) => {
      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const receivableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1210' },
      });
      const salesReturnAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '4200' },
      });

      let journalEntryId: string | undefined;
      if (receivableAccount && salesReturnAccount) {
        const entry = await tx.journalEntry.create({
          data: {
            organizationId,
            entryNumber,
            date: note.date,
            reference: note.noteNumber,
            narration:
              note.narration ??
              `Credit Note ${note.noteNumber} - ${note.customer.name}`,
            entryType: 'CREDIT_NOTE',
            fiscalYearId,
            isPosted: true,
            postedAt: new Date(),
            lines: {
              create: [
                {
                  accountId: salesReturnAccount.id,
                  debit: note.netAmount,
                  credit: new Prisma.Decimal(0),
                  narration: `Credit Note: ${note.customer.name} - ${note.reason ?? ''}`,
                },
                {
                  accountId: receivableAccount.id,
                  debit: new Prisma.Decimal(0),
                  credit: note.netAmount,
                  narration: `Credit Note: ${note.customer.name}`,
                },
              ],
            },
          },
        });
        journalEntryId = entry.id;
      }

      return tx.creditNote.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          journalEntryId,
        },
      });
    });
  }

  // ===== DEBIT NOTES =====

  async createDebitNote(
    organizationId: string,
    dto: {
      date: string;
      supplierId: string;
      purchaseId?: string;
      totalAmount: number;
      taxAmount?: number;
      netAmount: number;
      reason?: string;
      narration?: string;
    },
    createdBy?: string,
  ) {
    const count = await this.prisma.debitNote.count({
      where: { organizationId },
    });
    const noteNumber = `DN-${String(count + 1).padStart(6, '0')}`;
    return this.prisma.debitNote.create({
      data: {
        organizationId,
        noteNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId,
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        taxAmount: new Prisma.Decimal(dto.taxAmount ?? 0),
        netAmount: new Prisma.Decimal(dto.netAmount),
        reason: dto.reason,
        narration: dto.narration,
        createdBy,
      },
    });
  }

  async getDebitNotes(
    organizationId: string,
    filter: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.DebitNoteWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filter.status)
      where.status = filter.status as 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.debitNote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      this.prisma.debitNote.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async confirmDebitNote(
    organizationId: string,
    id: string,
    fiscalYearId: string,
  ) {
    const note = await this.prisma.debitNote.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { supplier: true },
    });
    if (!note) throw new NotFoundException('Debit note not found');
    if (note.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT notes can be confirmed');
    }

    return this.prisma.$transaction(async (tx) => {
      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const payableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2110' },
      });
      const purchaseReturnAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '5200' },
      });

      let journalEntryId: string | undefined;
      if (payableAccount && purchaseReturnAccount) {
        const entry = await tx.journalEntry.create({
          data: {
            organizationId,
            entryNumber,
            date: note.date,
            reference: note.noteNumber,
            narration:
              note.narration ??
              `Debit Note ${note.noteNumber} - ${note.supplier.name}`,
            entryType: 'DEBIT_NOTE',
            fiscalYearId,
            isPosted: true,
            postedAt: new Date(),
            lines: {
              create: [
                {
                  accountId: payableAccount.id,
                  debit: note.netAmount,
                  credit: new Prisma.Decimal(0),
                  narration: `Debit Note: ${note.supplier.name} - ${note.reason ?? ''}`,
                },
                {
                  accountId: purchaseReturnAccount.id,
                  debit: new Prisma.Decimal(0),
                  credit: note.netAmount,
                  narration: `Debit Note: ${note.supplier.name}`,
                },
              ],
            },
          },
        });
        journalEntryId = entry.id;
      }

      return tx.debitNote.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          journalEntryId,
        },
      });
    });
  }

  // ===== PURCHASE RETURNS =====

  async createPurchaseReturn(
    organizationId: string,
    dto: {
      date: string;
      supplierId: string;
      purchaseId?: string;
      warehouseId?: string;
      riceVarietyId?: string;
      quantity: number;
      rate: number;
      totalAmount: number;
      reason?: string;
      narration?: string;
    },
    createdBy?: string,
  ) {
    const count = await this.prisma.purchaseReturn.count({
      where: { organizationId },
    });
    const returnNumber = `PR-${String(count + 1).padStart(6, '0')}`;
    return this.prisma.purchaseReturn.create({
      data: {
        organizationId,
        returnNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId,
        warehouseId: dto.warehouseId,
        riceVarietyId: dto.riceVarietyId,
        quantity: new Prisma.Decimal(dto.quantity),
        rate: new Prisma.Decimal(dto.rate),
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        reason: dto.reason,
        narration: dto.narration,
        createdBy,
      },
    });
  }

  async getPurchaseReturns(
    organizationId: string,
    filter: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.PurchaseReturnWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filter.status)
      where.status = filter.status as
        | 'DRAFT'
        | 'APPROVED'
        | 'COMPLETED'
        | 'CANCELLED';
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      this.prisma.purchaseReturn.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // ===== SALES RETURNS =====

  async createSalesReturn(
    organizationId: string,
    dto: {
      date: string;
      customerId: string;
      salesOrderId?: string;
      invoiceId?: string;
      warehouseId?: string;
      riceVarietyId?: string;
      quantity: number;
      rate: number;
      totalAmount: number;
      reason?: string;
      narration?: string;
    },
    createdBy?: string,
  ) {
    const count = await this.prisma.salesReturn.count({
      where: { organizationId },
    });
    const returnNumber = `SR-${String(count + 1).padStart(6, '0')}`;
    return this.prisma.salesReturn.create({
      data: {
        organizationId,
        returnNumber,
        date: new Date(dto.date),
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId,
        invoiceId: dto.invoiceId,
        warehouseId: dto.warehouseId,
        riceVarietyId: dto.riceVarietyId,
        quantity: new Prisma.Decimal(dto.quantity),
        rate: new Prisma.Decimal(dto.rate),
        totalAmount: new Prisma.Decimal(dto.totalAmount),
        reason: dto.reason,
        narration: dto.narration,
        createdBy,
      },
    });
  }

  async getSalesReturns(
    organizationId: string,
    filter: {
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: string;
      limit?: string;
    },
  ) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.SalesReturnWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filter.status)
      where.status = filter.status as
        | 'DRAFT'
        | 'APPROVED'
        | 'COMPLETED'
        | 'CANCELLED';
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.salesReturn.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      this.prisma.salesReturn.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // ===== EDIT/DELETE POSTED ENTRIES (SAP-STYLE) =====

  async editPostedJournalEntry(
    organizationId: string,
    id: string,
    dto: {
      narration?: string;
      reference?: string;
    },
    userId?: string,
  ) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        entityType: 'JOURNAL_ENTRY',
        entityId: id,
        action: 'UPDATE',
        oldValues: {
          narration: entry.narration,
          reference: entry.reference,
        },
        newValues: {
          narration: dto.narration ?? entry.narration,
          reference: dto.reference ?? entry.reference,
        },
      },
    });

    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        narration: dto.narration ?? entry.narration,
        reference: dto.reference ?? entry.reference,
      },
    });
  }

  async deletePostedJournalEntry(
    organizationId: string,
    id: string,
    userId?: string,
  ) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');

    await this.prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        entityType: 'JOURNAL_ENTRY',
        entityId: id,
        action: 'DELETE',
        oldValues: {
          entryNumber: entry.entryNumber,
          date: entry.date.toISOString(),
          narration: entry.narration,
          entryType: entry.entryType,
          lines: entry.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit.toString(),
            credit: l.credit.toString(),
          })),
        },
      },
    });

    return this.prisma.journalEntry.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reverseJournalEntry(
    organizationId: string,
    id: string,
    dto: { date: string; narration?: string; fiscalYearId: string },
    userId?: string,
  ) {
    const original = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { lines: true },
    });
    if (!original) throw new NotFoundException('Journal entry not found');

    return this.prisma.$transaction(async (tx) => {
      const entryNumber = await this.generateEntryNumber(tx, organizationId);
      const reversalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(dto.date),
          reference: `Reversal of ${original.entryNumber}`,
          narration:
            dto.narration ??
            `Reversal of ${original.entryNumber}: ${original.narration ?? ''}`,
          entryType: 'REVERSAL',
          fiscalYearId: dto.fiscalYearId,
          isPosted: true,
          postedAt: new Date(),
          createdBy: userId,
          lines: {
            create: original.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.credit,
              credit: line.debit,
              narration: `Reversal: ${line.narration ?? ''}`,
              costCenter: line.costCenter ?? undefined,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          entityType: 'JOURNAL_ENTRY',
          entityId: id,
          action: 'UPDATE',
          oldValues: { status: 'posted' },
          newValues: {
            status: 'reversed',
            reversalEntryId: reversalEntry.id,
          },
        },
      });

      return reversalEntry;
    });
  }

  // ===== CASH BOOK =====

  async getCashBook(
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const cashAccount = await this.prisma.chartOfAccount.findFirst({
      where: { organizationId, code: '1110' },
    });
    if (!cashAccount)
      return {
        accountName: 'Cash in Hand',
        openingBalance: '0',
        entries: [],
        closingBalance: '0',
      };

    const dateFilter: Prisma.JournalEntryWhereInput = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: cashAccount.id,
        journalEntry: {
          organizationId,
          isPosted: true,
          deletedAt: null,
          ...dateFilter,
        },
      },
      include: {
        journalEntry: {
          select: {
            entryNumber: true,
            date: true,
            narration: true,
            reference: true,
            entryType: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    let runningBalance = new Prisma.Decimal(cashAccount.openingBalance);
    const entries = lines.map((line) => {
      runningBalance = runningBalance.add(line.debit).sub(line.credit);
      return {
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        narration: line.narration ?? line.journalEntry.narration,
        reference: line.journalEntry.reference,
        type: line.journalEntry.entryType,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        balance: runningBalance.toString(),
      };
    });

    return {
      accountName: cashAccount.name,
      accountCode: cashAccount.code,
      openingBalance: cashAccount.openingBalance.toString(),
      entries,
      closingBalance: runningBalance.toString(),
    };
  }

  // ===== DAY BOOK =====

  async getDayBook(organizationId: string, date: string) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const entries = await this.prisma.journalEntry.findMany({
      where: {
        organizationId,
        isPosted: true,
        deletedAt: null,
        date: { gte: targetDate, lt: nextDate },
      },
      include: {
        lines: {
          include: { account: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    const formattedEntries = entries.map((entry) => {
      let entryDebit = new Prisma.Decimal(0);
      let entryCredit = new Prisma.Decimal(0);
      for (const line of entry.lines) {
        entryDebit = entryDebit.add(line.debit);
        entryCredit = entryCredit.add(line.credit);
      }
      totalDebit = totalDebit.add(entryDebit);
      totalCredit = totalCredit.add(entryCredit);

      return {
        entryNumber: entry.entryNumber,
        date: entry.date,
        narration: entry.narration,
        reference: entry.reference,
        entryType: entry.entryType,
        lines: entry.lines.map((l) => ({
          accountCode: l.account.code,
          accountName: l.account.name,
          debit: l.debit.toString(),
          credit: l.credit.toString(),
          narration: l.narration,
        })),
        totalDebit: entryDebit.toString(),
        totalCredit: entryCredit.toString(),
      };
    });

    return {
      date,
      totalEntries: entries.length,
      entries: formattedEntries,
      totalDebit: totalDebit.toString(),
      totalCredit: totalCredit.toString(),
    };
  }

  // ===== ACCOUNT STATEMENT =====

  async getAccountStatement(
    organizationId: string,
    accountId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const account = await this.prisma.chartOfAccount.findFirst({
      where: { id: accountId, organizationId },
    });
    if (!account) throw new NotFoundException('Account not found');

    const dateFilter: Prisma.JournalEntryWhereInput = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          organizationId,
          isPosted: true,
          deletedAt: null,
          ...dateFilter,
        },
      },
      include: {
        journalEntry: {
          select: {
            entryNumber: true,
            date: true,
            narration: true,
            reference: true,
            entryType: true,
          },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    let runningBalance = new Prisma.Decimal(account.openingBalance);
    const entries = lines.map((line) => {
      runningBalance = runningBalance.add(line.debit).sub(line.credit);
      return {
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        narration: line.narration ?? line.journalEntry.narration,
        reference: line.journalEntry.reference,
        entryType: line.journalEntry.entryType,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        balance: runningBalance.toString(),
      };
    });

    return {
      account: {
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        openingBalance: account.openingBalance.toString(),
      },
      entries,
      closingBalance: runningBalance.toString(),
      totalDebit: lines
        .reduce((sum, l) => sum.add(l.debit), new Prisma.Decimal(0))
        .toString(),
      totalCredit: lines
        .reduce((sum, l) => sum.add(l.credit), new Prisma.Decimal(0))
        .toString(),
    };
  }

  // ===== CASH FLOW STATEMENT =====

  async getCashFlowStatement(
    organizationId: string,
    startDate: string,
    endDate: string,
  ) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isGroup: false },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          organizationId,
          isPosted: true,
          deletedAt: null,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
    });

    let operatingIn = new Prisma.Decimal(0);
    let operatingOut = new Prisma.Decimal(0);
    let investingIn = new Prisma.Decimal(0);
    let investingOut = new Prisma.Decimal(0);
    let financingIn = new Prisma.Decimal(0);
    let financingOut = new Prisma.Decimal(0);

    for (const line of lines) {
      const account = accountMap.get(line.accountId);
      if (!account) continue;

      const accountType = account.accountType;
      if (accountType === 'INCOME' || accountType === 'EXPENSE') {
        operatingIn = operatingIn.add(line.credit);
        operatingOut = operatingOut.add(line.debit);
      } else if (accountType === 'ASSET') {
        const code = account.code;
        if (code.startsWith('1') && !code.startsWith('11')) {
          investingOut = investingOut.add(line.debit);
          investingIn = investingIn.add(line.credit);
        }
      } else if (accountType === 'LIABILITY' || accountType === 'EQUITY') {
        financingIn = financingIn.add(line.credit);
        financingOut = financingOut.add(line.debit);
      }
    }

    return {
      period: { startDate, endDate },
      operatingActivities: {
        inflows: operatingIn.toString(),
        outflows: operatingOut.toString(),
        net: operatingIn.sub(operatingOut).toString(),
      },
      investingActivities: {
        inflows: investingIn.toString(),
        outflows: investingOut.toString(),
        net: investingIn.sub(investingOut).toString(),
      },
      financingActivities: {
        inflows: financingIn.toString(),
        outflows: financingOut.toString(),
        net: financingIn.sub(financingOut).toString(),
      },
      netCashFlow: operatingIn
        .sub(operatingOut)
        .add(investingIn)
        .sub(investingOut)
        .add(financingIn)
        .sub(financingOut)
        .toString(),
    };
  }
}
