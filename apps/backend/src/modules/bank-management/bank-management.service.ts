import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateBankReconciliationDto,
  MatchReconciliationDto,
  CreateChequeDto,
  UpdateChequeStatusDto,
  BankFilterDto,
} from './dto/bank.dto';

@Injectable()
export class BankManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== BANK RECONCILIATION =====

  async createReconciliationEntry(
    organizationId: string,
    dto: CreateBankReconciliationDto,
  ) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, organizationId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    return this.prisma.bankReconciliation.create({
      data: {
        organizationId,
        bankAccountId: dto.bankAccountId,
        date: new Date(dto.date),
        statementDate: new Date(dto.statementDate),
        description: dto.description,
        debit: new Prisma.Decimal(dto.debit ?? 0),
        credit: new Prisma.Decimal(dto.credit ?? 0),
        balance: new Prisma.Decimal(dto.balance),
        referenceNumber: dto.referenceNumber,
      },
    });
  }

  async getReconciliationEntries(
    organizationId: string,
    filter: BankFilterDto,
  ) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.BankReconciliationWhereInput = { organizationId };
    if (filter.bankAccountId) where.bankAccountId = filter.bankAccountId;
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.bankReconciliation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: { bankAccount: true },
      }),
      this.prisma.bankReconciliation.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async matchReconciliation(
    organizationId: string,
    id: string,
    dto: MatchReconciliationDto,
  ) {
    const entry = await this.prisma.bankReconciliation.findFirst({
      where: { id, organizationId },
    });
    if (!entry) throw new NotFoundException('Reconciliation entry not found');
    return this.prisma.bankReconciliation.update({
      where: { id },
      data: {
        matchedEntryId: dto.matchedEntryId,
        status: 'MATCHED',
      },
    });
  }

  async getReconciliationSummary(
    organizationId: string,
    bankAccountId: string,
  ) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, organizationId },
      include: { account: true },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const entries = await this.prisma.bankReconciliation.findMany({
      where: { organizationId, bankAccountId },
      orderBy: { date: 'desc' },
      take: 1,
    });
    const lastStatementBalance =
      entries.length > 0 ? entries[0].balance.toString() : '0';

    const journalLines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: bankAccount.accountId,
        journalEntry: { organizationId, isPosted: true },
      },
    });
    let bookBalance = new Prisma.Decimal(bankAccount.openingBalance);
    for (const line of journalLines) {
      bookBalance = bookBalance.add(line.debit).sub(line.credit);
    }

    const unmatchedCount = await this.prisma.bankReconciliation.count({
      where: {
        organizationId,
        bankAccountId,
        status: 'PENDING_RECONCILIATION',
      },
    });

    return {
      bankAccountId,
      bankName: bankAccount.bankName,
      accountNumber: bankAccount.accountNumber,
      lastStatementBalance,
      bookBalance: bookBalance.toString(),
      difference: new Prisma.Decimal(lastStatementBalance)
        .sub(bookBalance)
        .toString(),
      unmatchedEntries: unmatchedCount,
    };
  }

  // ===== CHEQUE MANAGEMENT =====

  async createCheque(organizationId: string, dto: CreateChequeDto) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, organizationId },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    return this.prisma.cheque.create({
      data: {
        organizationId,
        bankAccountId: dto.bankAccountId,
        chequeNumber: dto.chequeNumber,
        date: new Date(dto.date),
        amount: new Prisma.Decimal(dto.amount),
        payee: dto.payee,
        issuedTo: dto.issuedTo,
        partyType: dto.partyType,
        partyId: dto.partyId,
        narration: dto.narration,
      },
    });
  }

  async getCheques(organizationId: string, filter: BankFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.ChequeWhereInput = { organizationId };
    if (filter.bankAccountId) where.bankAccountId = filter.bankAccountId;
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) where.date.gte = new Date(filter.startDate);
      if (filter.endDate) where.date.lte = new Date(filter.endDate);
    }
    const [data, total] = await Promise.all([
      this.prisma.cheque.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
        include: { bankAccount: true },
      }),
      this.prisma.cheque.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateChequeStatus(
    organizationId: string,
    id: string,
    dto: UpdateChequeStatusDto,
  ) {
    const cheque = await this.prisma.cheque.findFirst({
      where: { id, organizationId },
    });
    if (!cheque) throw new NotFoundException('Cheque not found');

    if (cheque.status === 'CANCELLED') {
      throw new BadRequestException('Cannot update a cancelled cheque');
    }

    return this.prisma.cheque.update({
      where: { id },
      data: {
        status: dto.status,
        clearanceDate: dto.clearanceDate
          ? new Date(dto.clearanceDate)
          : undefined,
        bounceReason: dto.bounceReason,
      },
    });
  }

  async getBankBook(
    organizationId: string,
    bankAccountId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: { id: bankAccountId, organizationId },
      include: { account: true },
    });
    if (!bankAccount) throw new NotFoundException('Bank account not found');

    const dateFilter: Prisma.JournalEntryWhereInput = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: bankAccount.accountId,
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
          },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    let runningBalance = new Prisma.Decimal(bankAccount.openingBalance);
    const entries = lines.map((line) => {
      runningBalance = runningBalance.add(line.debit).sub(line.credit);
      return {
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        narration: line.narration ?? line.journalEntry.narration,
        reference: line.journalEntry.reference,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
        balance: runningBalance.toString(),
      };
    });

    return {
      bankAccount: {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        openingBalance: bankAccount.openingBalance.toString(),
      },
      entries,
      closingBalance: runningBalance.toString(),
    };
  }
}
