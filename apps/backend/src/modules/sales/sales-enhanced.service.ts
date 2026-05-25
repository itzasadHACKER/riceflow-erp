import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SalesEnhancedService {
  constructor(private prisma: PrismaService) {}

  private async getFiscalYearId(orgId: string, tx?: any) {
    const db = tx || this.prisma;
    const fy = await db.fiscalYear.findFirst({
      where: { organizationId: orgId, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    });
    if (fy) return fy.id;
    const fallback = await db.fiscalYear.findFirst({ where: { organizationId: orgId }, orderBy: { endDate: 'desc' } });
    if (!fallback) throw new BadRequestException('No fiscal year configured');
    return fallback.id;
  }

  // ─── Running Balance ─────────────────────────────────────────
  async getRunningBalance(orgId: string, entityType: string, entityId: string) {
    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    if (entityType === 'CUSTOMER') {
      const invoices = await this.prisma.salesInvoice.findMany({
        where: { organizationId: orgId, customerId: entityId, journalEntryId: { not: null } },
        select: { netAmount: true },
      });
      totalDebit = invoices.reduce((s, i) => s.add(i.netAmount), new Decimal(0));

      const credits = await this.prisma.creditNote.findMany({
        where: { organizationId: orgId, customerId: entityId, status: 'CONFIRMED' },
        select: { netAmount: true },
      });
      totalCredit = credits.reduce((s, c) => s.add(c.netAmount), new Decimal(0));

      const receipts = await this.prisma.salesReceipt.findMany({
        where: { organizationId: orgId, customerId: entityId, journalEntryId: { not: null } },
        select: { totalAmount: true },
      });
      totalCredit = receipts.reduce((s, r) => s.add(r.totalAmount), totalCredit);

      const returns = await this.prisma.salesReturn.findMany({
        where: { organizationId: orgId, customerId: entityId, status: 'APPROVED' },
        select: { totalAmount: true },
      });
      totalCredit = returns.reduce((s, r) => s.add(r.totalAmount), totalCredit);

      const advances = await this.prisma.advancePayment.findMany({
        where: { organizationId: orgId, partnerId: entityId, partnerType: 'CUSTOMER' },
        select: { amount: true, appliedAmount: true },
      });
      totalCredit = advances.reduce((s, a) => s.add(a.amount), totalCredit);
    }

    if (entityType === 'VENDOR' || entityType === 'SUPPLIER') {
      const purchases = await this.prisma.paddyPurchase.findMany({
        where: { organizationId: orgId, supplierId: entityId },
        select: { netAmount: true },
      });
      totalCredit = purchases.reduce((s, p) => s.add(p.netAmount), new Decimal(0));

      const debits = await this.prisma.debitNote.findMany({
        where: { organizationId: orgId, supplierId: entityId, status: 'CONFIRMED' },
        select: { netAmount: true },
      });
      totalDebit = debits.reduce((s, d) => s.add(d.netAmount), new Decimal(0));

      const pReturns = await this.prisma.purchaseReturn.findMany({
        where: { organizationId: orgId, supplierId: entityId, status: 'APPROVED' },
        select: { totalAmount: true },
      });
      totalDebit = pReturns.reduce((s, r) => s.add(r.totalAmount), totalDebit);
    }

    if (entityType === 'EMPLOYEE') {
      const empAdvances = await this.prisma.employeeAdvance.findMany({
        where: { employeeId: entityId, status: 'APPROVED' },
        select: { amount: true },
      });
      totalDebit = empAdvances.reduce((s, a) => s.add(a.amount), new Decimal(0));

      const salaries = await this.prisma.salarySlip.findMany({
        where: { employeeId: entityId, status: 'PAID' },
        select: { netSalary: true },
      });
      totalCredit = salaries.reduce((s, sl) => s.add(sl.netSalary), new Decimal(0));
    }

    const balance = totalDebit.sub(totalCredit);
    return {
      entityType,
      entityId,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      balance: balance.toNumber(),
      balanceType: balance.gt(0) ? 'DEBIT' : balance.lt(0) ? 'CREDIT' : 'ZERO',
    };
  }

  // ─── Credit Memo (AR) ───────────────────────────────────────
  async createCreditMemo(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.creditNote.count({ where: { organizationId: orgId } });
    const noteNumber = `CN-${String(count + 1).padStart(4, '0')}`;
    const netAmount = dto.totalAmount - (dto.taxAmount || 0);

    return this.prisma.creditNote.create({
      data: {
        organizationId: orgId,
        noteNumber,
        date: new Date(dto.date),
        customerId: dto.customerId,
        salesInvoiceId: dto.salesInvoiceId || null,
        totalAmount: dto.totalAmount,
        taxAmount: dto.taxAmount || 0,
        netAmount,
        reason: dto.reason,
        narration: dto.narration,
        createdBy: userId,
      },
      include: { customer: true, salesInvoice: true },
    });
  }

  async postCreditMemo(orgId: string, userId: string, id: string) {
    const memo = await this.prisma.creditNote.findFirst({
      where: { id, organizationId: orgId },
      include: { customer: true },
    });
    if (!memo) throw new NotFoundException('Credit memo not found');
    if (memo.status === 'CONFIRMED') throw new BadRequestException('Already posted');

    return this.prisma.$transaction(async (tx) => {
      const arAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1130' } });
      const revenueAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '4100' } });
      if (!arAccount || !revenueAccount) throw new NotFoundException('Required accounts not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: memo.date,
          reference: memo.noteNumber,
          narration: `Credit memo ${memo.noteNumber} for ${memo.customer.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: revenueAccount.id, debit: Number(memo.netAmount), credit: 0, narration: `Sales return/credit - ${memo.customer.name}` },
            { accountId: arAccount.id, debit: 0, credit: Number(memo.netAmount), narration: `Reduce receivable - ${memo.customer.name}` },
          ]},
        },
      });

      return tx.creditNote.update({
        where: { id },
        data: { status: 'CONFIRMED', journalEntryId: je.id },
        include: { customer: true },
      });
    });
  }

  async findAllCreditMemos(orgId: string) {
    return this.prisma.creditNote.findMany({
      where: { organizationId: orgId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Debit Note (AP) ─────────────────────────────────────────
  async createDebitNote(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.debitNote.count({ where: { organizationId: orgId } });
    const noteNumber = `DN-${String(count + 1).padStart(4, '0')}`;
    const netAmount = dto.totalAmount - (dto.taxAmount || 0);

    return this.prisma.debitNote.create({
      data: {
        organizationId: orgId,
        noteNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId || null,
        totalAmount: dto.totalAmount,
        taxAmount: dto.taxAmount || 0,
        netAmount,
        reason: dto.reason,
        narration: dto.narration,
        createdBy: userId,
      },
      include: { supplier: true },
    });
  }

  async postDebitNote(orgId: string, userId: string, id: string) {
    const note = await this.prisma.debitNote.findFirst({
      where: { id, organizationId: orgId },
      include: { supplier: true },
    });
    if (!note) throw new NotFoundException('Debit note not found');
    if (note.status === 'CONFIRMED') throw new BadRequestException('Already posted');

    return this.prisma.$transaction(async (tx) => {
      const apAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '2100' } });
      const purchaseAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '5100' } });
      if (!apAccount || !purchaseAccount) throw new NotFoundException('Required accounts not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: note.date,
          reference: note.noteNumber,
          narration: `Debit note ${note.noteNumber} for ${note.supplier.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: apAccount.id, debit: Number(note.netAmount), credit: 0, narration: `Reduce payable - ${note.supplier.name}` },
            { accountId: purchaseAccount.id, debit: 0, credit: Number(note.netAmount), narration: `Purchase return/debit - ${note.supplier.name}` },
          ]},
        },
      });

      return tx.debitNote.update({
        where: { id },
        data: { status: 'CONFIRMED', journalEntryId: je.id },
        include: { supplier: true },
      });
    });
  }

  async findAllDebitNotes(orgId: string) {
    return this.prisma.debitNote.findMany({
      where: { organizationId: orgId },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Sales Return (2-step) ──────────────────────────────────
  async createSalesReturn(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.salesReturn.count({ where: { organizationId: orgId } });
    const returnNumber = `SR-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.salesReturn.create({
      data: {
        organizationId: orgId,
        returnNumber,
        date: new Date(dto.date),
        customerId: dto.customerId,
        invoiceId: dto.invoiceId || null,
        salesOrderId: dto.salesOrderId || null,
        warehouseId: dto.warehouseId || null,
        riceVarietyId: dto.riceVarietyId || null,
        quantity: dto.quantity,
        rate: dto.rate,
        totalAmount: dto.quantity * dto.rate,
        reason: dto.reason,
        createdBy: userId,
      },
      include: { customer: true },
    });
  }

  async approveSalesReturn(orgId: string, userId: string, id: string) {
    const ret = await this.prisma.salesReturn.findFirst({
      where: { id, organizationId: orgId },
      include: { customer: true },
    });
    if (!ret) throw new NotFoundException('Sales return not found');

    return this.prisma.$transaction(async (tx) => {
      const arAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1130' } });
      const revenueAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '4100' } });
      if (!arAccount || !revenueAccount) throw new NotFoundException('Accounts not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: ret.date,
          reference: ret.returnNumber,
          narration: `Sales return ${ret.returnNumber} from ${ret.customer.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: revenueAccount.id, debit: Number(ret.totalAmount), credit: 0, narration: `Sales return - ${ret.customer.name}` },
            { accountId: arAccount.id, debit: 0, credit: Number(ret.totalAmount), narration: `Reduce receivable - ${ret.customer.name}` },
          ]},
        },
      });

      return tx.salesReturn.update({
        where: { id },
        data: { status: 'APPROVED', journalEntryId: je.id },
        include: { customer: true },
      });
    });
  }

  async findAllSalesReturns(orgId: string) {
    return this.prisma.salesReturn.findMany({
      where: { organizationId: orgId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Purchase Return ────────────────────────────────────────
  async createPurchaseReturn(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.purchaseReturn.count({ where: { organizationId: orgId } });
    const returnNumber = `PR-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.purchaseReturn.create({
      data: {
        organizationId: orgId,
        returnNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId || null,
        warehouseId: dto.warehouseId || null,
        riceVarietyId: dto.riceVarietyId || null,
        quantity: dto.quantity,
        rate: dto.rate,
        totalAmount: dto.quantity * dto.rate,
        reason: dto.reason,
        createdBy: userId,
      },
      include: { supplier: true },
    });
  }

  async approvePurchaseReturn(orgId: string, userId: string, id: string) {
    const ret = await this.prisma.purchaseReturn.findFirst({
      where: { id, organizationId: orgId },
      include: { supplier: true },
    });
    if (!ret) throw new NotFoundException('Purchase return not found');

    return this.prisma.$transaction(async (tx) => {
      const apAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '2100' } });
      const purchaseAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '5100' } });
      if (!apAccount || !purchaseAccount) throw new NotFoundException('Accounts not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: ret.date,
          reference: ret.returnNumber,
          narration: `Purchase return ${ret.returnNumber} to ${ret.supplier.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: apAccount.id, debit: Number(ret.totalAmount), credit: 0, narration: `Reduce payable - ${ret.supplier.name}` },
            { accountId: purchaseAccount.id, debit: 0, credit: Number(ret.totalAmount), narration: `Purchase return - ${ret.supplier.name}` },
          ]},
        },
      });

      return tx.purchaseReturn.update({
        where: { id },
        data: { status: 'APPROVED', journalEntryId: je.id },
        include: { supplier: true },
      });
    });
  }

  async findAllPurchaseReturns(orgId: string) {
    return this.prisma.purchaseReturn.findMany({
      where: { organizationId: orgId },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Bank Deposit ───────────────────────────────────────────
  async createBankDeposit(orgId: string, userId: string, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const bank = await tx.bankAccount.findFirst({ where: { id: dto.bankAccountId, organizationId: orgId } });
      if (!bank) throw new NotFoundException('Bank account not found');

      const cashAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1110' } });
      const bankChartAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1120' } });
      if (!cashAccount || !bankChartAccount) throw new NotFoundException('Required accounts not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: new Date(dto.date),
          reference: dto.reference || `DEPOSIT-${bank.accountNumber}`,
          narration: dto.narration || `Bank deposit to ${bank.bankName} - ${bank.accountNumber}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: bankChartAccount.id, debit: dto.amount, credit: 0, narration: `Deposit to ${bank.bankName}` },
            { accountId: cashAccount.id, debit: 0, credit: dto.amount, narration: `Cash deposited to bank` },
          ]},
        },
      });

      return { deposit: { bankAccountId: dto.bankAccountId, amount: dto.amount, type: dto.depositType, date: dto.date }, journalEntry: je };
    });
  }

  // ─── Payment (Customer Receipt / Vendor Payment) ────────────
  async createPayment(orgId: string, userId: string, dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const cashAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1110' } });
      const bankAccount = dto.paymentMethod !== 'CASH' && dto.bankAccountId
        ? await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1120' } })
        : null;
      const paymentAccount = bankAccount || cashAccount;
      if (!paymentAccount) throw new NotFoundException('Payment account not found');

      let counterAccount: { id: string } | null;
      let narration: string;

      if (dto.partnerType === 'CUSTOMER') {
        counterAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '1130' } });
        const cust = await tx.customer.findFirst({ where: { id: dto.partnerId, organizationId: orgId } });
        narration = `Payment received from ${cust?.name || 'customer'}`;
      } else {
        counterAccount = await tx.chartOfAccount.findFirst({ where: { organizationId: orgId, code: '2100' } });
        const sup = await tx.supplier.findFirst({ where: { id: dto.partnerId, organizationId: orgId } });
        narration = `Payment to ${sup?.name || 'vendor'}`;
      }
      if (!counterAccount) throw new NotFoundException('Counter account not found');

      const jeCount = await tx.journalEntry.count({ where: { organizationId: orgId } });
      const debitAcct = dto.partnerType === 'CUSTOMER' ? paymentAccount.id : counterAccount.id;
      const creditAcct = dto.partnerType === 'CUSTOMER' ? counterAccount.id : paymentAccount.id;

      const fiscalYearId = await this.getFiscalYearId(orgId, tx);
      const je = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          entryNumber: `JE-${String(jeCount + 1).padStart(6, '0')}`,
          date: new Date(dto.date),
          reference: dto.reference || `PMT-${String(jeCount + 1).padStart(4, '0')}`,
          narration,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true, postedBy: userId, postedAt: new Date(),
          lines: { create: [
            { accountId: debitAcct, debit: dto.amount, credit: 0, narration },
            { accountId: creditAcct, debit: 0, credit: dto.amount, narration },
          ]},
        },
      });

      if (dto.invoiceIds?.length) {
        await tx.salesInvoice.updateMany({
          where: { id: { in: dto.invoiceIds }, organizationId: orgId },
          data: { paymentStatus: 'PAID' },
        });
      }

      return { payment: { partnerType: dto.partnerType, partnerId: dto.partnerId, amount: dto.amount, method: dto.paymentMethod }, journalEntry: je };
    });
  }

  // ─── Summary ─────────────────────────────────────────────────
  async getEnhancedSummary(orgId: string) {
    const [creditMemos, debitNotes, salesReturns, purchaseReturns] = await Promise.all([
      this.prisma.creditNote.count({ where: { organizationId: orgId } }),
      this.prisma.debitNote.count({ where: { organizationId: orgId } }),
      this.prisma.salesReturn.count({ where: { organizationId: orgId } }),
      this.prisma.purchaseReturn.count({ where: { organizationId: orgId } }),
    ]);
    return { creditMemos, debitNotes, salesReturns, purchaseReturns };
  }
}
