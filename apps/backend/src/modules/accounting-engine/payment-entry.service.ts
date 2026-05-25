import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GeneralLedgerService } from './general-ledger.service';
import { PaymentEntryDto, PaymentReferenceDto } from './dto/gl-entry.dto';

@Injectable()
export class PaymentEntryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly glService: GeneralLedgerService,
  ) {}

  // =========================================================================
  // CREATE: Payment Entry (Unified — replaces PaymentVoucher/ReceiptVoucher)
  // =========================================================================

  async createPaymentEntry(
    organizationId: string,
    userId: string,
    dto: PaymentEntryDto,
  ) {
    // Validate accounts
    const [paidFrom, paidTo] = await Promise.all([
      this.prisma.chartOfAccount.findFirst({
        where: { id: dto.paidFromAccountId, organizationId },
      }),
      this.prisma.chartOfAccount.findFirst({
        where: { id: dto.paidToAccountId, organizationId },
      }),
    ]);

    if (!paidFrom) throw new NotFoundException('Paid From account not found');
    if (!paidTo) throw new NotFoundException('Paid To account not found');
    if (paidFrom.isGroup) throw new BadRequestException(`"${paidFrom.name}" is a group account. Select a ledger account.`);
    if (paidTo.isGroup) throw new BadRequestException(`"${paidTo.name}" is a group account. Select a ledger account.`);

    // Validate amounts
    if (dto.paidAmount <= 0) throw new BadRequestException('Paid amount must be positive');
    if (dto.receivedAmount <= 0) throw new BadRequestException('Received amount must be positive');

    // Calculate allocations
    let totalAllocated = 0;
    if (dto.references && dto.references.length > 0) {
      totalAllocated = dto.references.reduce((sum, r) => sum + r.allocatedAmount, 0);
      for (const ref of dto.references) {
        if (ref.allocatedAmount <= 0) {
          throw new BadRequestException('Allocated amount must be positive');
        }
        if (ref.allocatedAmount > ref.outstandingAmount) {
          throw new BadRequestException(
            `Allocated amount (${ref.allocatedAmount}) exceeds outstanding (${ref.outstandingAmount}) for ${ref.referenceName}`,
          );
        }
      }
    }

    const unallocated = dto.paidAmount - totalAllocated;

    return this.prisma.$transaction(async (tx) => {
      // Generate payment number
      const count = await tx.paymentEntry.count({ where: { organizationId } });
      const prefix = dto.paymentType === 'RECEIVE' ? 'PE-RCV' : dto.paymentType === 'PAY' ? 'PE-PAY' : 'PE-TRF';
      const paymentNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;

      // Create payment entry
      const payment = await tx.paymentEntry.create({
        data: {
          organizationId,
          paymentNumber,
          paymentType: dto.paymentType as 'RECEIVE' | 'PAY' | 'INTERNAL_TRANSFER',
          postingDate: new Date(dto.postingDate),
          partyType: dto.partyType,
          partyId: dto.partyId,
          partyName: dto.partyName,
          paidFromAccountId: dto.paidFromAccountId,
          paidToAccountId: dto.paidToAccountId,
          paidFromCurrency: dto.paidFromAccountId ? paidFrom.currency : 'PKR',
          paidToCurrency: dto.paidToAccountId ? paidTo.currency : 'PKR',
          paidAmount: dto.paidAmount,
          receivedAmount: dto.receivedAmount,
          exchangeRate: dto.exchangeRate || 1,
          referenceNo: dto.referenceNo,
          referenceDate: dto.referenceDate ? new Date(dto.referenceDate) : null,
          modeOfPayment: dto.modeOfPayment,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          totalAllocatedAmount: totalAllocated,
          unallocatedAmount: unallocated > 0 ? unallocated : 0,
          remarks: dto.remarks,
          createdBy: userId,
        },
      });

      // Create references
      if (dto.references && dto.references.length > 0) {
        for (const ref of dto.references) {
          await tx.paymentEntryReference.create({
            data: {
              paymentEntryId: payment.id,
              referenceDocType: ref.referenceDocType,
              referenceDocId: ref.referenceDocId,
              referenceName: ref.referenceName,
              dueDate: ref.dueDate ? new Date(ref.dueDate) : null,
              totalAmount: ref.totalAmount,
              outstandingAmount: ref.outstandingAmount,
              allocatedAmount: ref.allocatedAmount,
            },
          });
        }
      }

      return payment;
    });
  }

  // =========================================================================
  // SUBMIT: Post payment entry to GL
  // =========================================================================

  async submitPaymentEntry(
    organizationId: string,
    userId: string,
    paymentId: string,
  ) {
    const payment = await this.prisma.paymentEntry.findFirst({
      where: { id: paymentId, organizationId },
      include: { references: true },
    });

    if (!payment) throw new NotFoundException('Payment entry not found');
    if (payment.docStatus !== 0) {
      throw new BadRequestException('Only draft payments can be submitted');
    }

    // Build GL entries (convert Prisma nulls to undefined for DTO compatibility)
    const opt = (v: string | null | undefined): string | undefined => v ?? undefined;
    const glEntries: Array<{
      accountId: string;
      debit: number;
      credit: number;
      partyType?: string;
      partyId?: string;
      partyName?: string;
      costCenterId?: string;
      projectId?: string;
      remarks?: string;
    }> = [];

    if (payment.paymentType === 'RECEIVE') {
      glEntries.push(
        {
          accountId: payment.paidToAccountId,
          debit: Number(payment.receivedAmount),
          credit: 0,
          partyType: opt(payment.partyType),
          partyId: opt(payment.partyId),
          partyName: opt(payment.partyName),
          costCenterId: opt(payment.costCenterId),
          projectId: opt(payment.projectId),
        },
        {
          accountId: payment.paidFromAccountId,
          debit: 0,
          credit: Number(payment.paidAmount),
          partyType: opt(payment.partyType),
          partyId: opt(payment.partyId),
          partyName: opt(payment.partyName),
          costCenterId: opt(payment.costCenterId),
          projectId: opt(payment.projectId),
        },
      );
    } else if (payment.paymentType === 'PAY') {
      glEntries.push(
        {
          accountId: payment.paidFromAccountId,
          debit: Number(payment.paidAmount),
          credit: 0,
          partyType: opt(payment.partyType),
          partyId: opt(payment.partyId),
          partyName: opt(payment.partyName),
          costCenterId: opt(payment.costCenterId),
          projectId: opt(payment.projectId),
        },
        {
          accountId: payment.paidToAccountId,
          debit: 0,
          credit: Number(payment.receivedAmount),
          costCenterId: opt(payment.costCenterId),
          projectId: opt(payment.projectId),
        },
      );
    } else {
      glEntries.push(
        {
          accountId: payment.paidToAccountId,
          debit: Number(payment.receivedAmount),
          credit: 0,
        },
        {
          accountId: payment.paidFromAccountId,
          debit: 0,
          credit: Number(payment.paidAmount),
        },
      );
    }

    // Handle writeoff
    if (Number(payment.writeoffAmount) > 0 && payment.writeoffAccountId) {
      glEntries.push({
        accountId: payment.writeoffAccountId,
        debit: Number(payment.writeoffAmount),
        credit: 0,
        remarks: 'Write-off amount',
      });
      // Adjust the credited/debited amount
      const lastEntry = glEntries[glEntries.length - 2];
      if (lastEntry.credit > 0) {
        lastEntry.credit -= Number(payment.writeoffAmount);
      }
    }

    // Handle exchange rate difference
    const exchangeDiff = Number(payment.differenceAmount);
    if (Math.abs(exchangeDiff) > 0.0001) {
      const exchangeAccount = await this.prisma.chartOfAccount.findFirst({
        where: { organizationId, code: '4300' }, // Other Income (gain) or relevant account
      });
      if (exchangeAccount) {
        glEntries.push({
          accountId: exchangeAccount.id,
          debit: exchangeDiff < 0 ? Math.abs(exchangeDiff) : 0,
          credit: exchangeDiff > 0 ? exchangeDiff : 0,
          remarks: 'Exchange rate difference',
        });
      }
    }

    // Post to GL
    await this.glService.postToLedger(organizationId, userId, {
      voucherType: 'Payment Entry',
      voucherNo: payment.paymentNumber,
      voucherId: payment.id,
      postingDate: payment.postingDate.toISOString().split('T')[0],
      remarks: payment.remarks || `Payment ${payment.paymentNumber}`,
      entries: glEntries,
    });

    // Update payment status
    await this.prisma.paymentEntry.update({
      where: { id: paymentId },
      data: {
        docStatus: 1,
        submittedBy: userId,
        submittedAt: new Date(),
      },
    });

    // Update invoice payment status for references
    for (const ref of payment.references) {
      if (ref.referenceDocType === 'Sales Invoice') {
        await this.updateInvoicePaymentStatus(ref.referenceDocId, Number(ref.allocatedAmount), 'sales');
      } else if (ref.referenceDocType === 'Purchase Invoice') {
        await this.updateInvoicePaymentStatus(ref.referenceDocId, Number(ref.allocatedAmount), 'purchase');
      }
    }

    return { success: true, paymentNumber: payment.paymentNumber, status: 'SUBMITTED' };
  }

  // =========================================================================
  // CANCEL: Cancel payment entry
  // =========================================================================

  async cancelPaymentEntry(
    organizationId: string,
    userId: string,
    paymentId: string,
    reason: string,
  ) {
    const payment = await this.prisma.paymentEntry.findFirst({
      where: { id: paymentId, organizationId },
    });

    if (!payment) throw new NotFoundException('Payment entry not found');
    if (payment.docStatus !== 1) {
      throw new BadRequestException('Only submitted payments can be cancelled');
    }

    // Reverse GL entries
    await this.glService.reverseLedgerEntries(
      organizationId,
      userId,
      'Payment Entry',
      payment.paymentNumber,
      payment.id,
      new Date().toISOString().split('T')[0],
      reason,
    );

    // Update payment status
    await this.prisma.paymentEntry.update({
      where: { id: paymentId },
      data: {
        docStatus: 2,
        cancelledBy: userId,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });

    return { success: true, paymentNumber: payment.paymentNumber, status: 'CANCELLED' };
  }

  // =========================================================================
  // LIST: Payment entries
  // =========================================================================

  async listPaymentEntries(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    partyType?: string,
    partyId?: string,
    paymentType?: string,
    docStatus?: number,
  ) {
    const where: Prisma.PaymentEntryWhereInput = {
      organizationId,
      ...(partyType ? { partyType } : {}),
      ...(partyId ? { partyId } : {}),
      ...(paymentType ? { paymentType: paymentType as 'RECEIVE' | 'PAY' | 'INTERNAL_TRANSFER' } : {}),
      ...(docStatus !== undefined ? { docStatus } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.paymentEntry.findMany({
        where,
        include: { references: true },
        orderBy: { postingDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.paymentEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // =========================================================================
  // GET: Payment entry detail
  // =========================================================================

  async getPaymentEntry(organizationId: string, id: string) {
    const payment = await this.prisma.paymentEntry.findFirst({
      where: { id, organizationId },
      include: { references: true },
    });
    if (!payment) throw new NotFoundException('Payment entry not found');
    return payment;
  }

  // =========================================================================
  // GET: Outstanding invoices for a party (for payment allocation)
  // =========================================================================

  async getOutstandingInvoices(
    organizationId: string,
    partyType: string,
    partyId: string,
  ) {
    if (partyType === 'CUSTOMER') {
      const invoices = await this.prisma.salesInvoice.findMany({
        where: {
          organizationId,
          customerId: partyId,
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        orderBy: { date: 'asc' },
      });

      return invoices.map(inv => ({
        docType: 'Sales Invoice',
        docId: inv.id,
        docName: inv.invoiceNumber,
        date: inv.date,
        dueDate: inv.dueDate,
        totalAmount: Number(inv.netAmount),
        paidAmount: Number(inv.paidAmount),
        outstandingAmount: Number(inv.netAmount) - Number(inv.paidAmount),
      }));
    } else {
      const invoices = await this.prisma.purchaseInvoice.findMany({
        where: {
          organizationId,
          supplierId: partyId,
          paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        },
        orderBy: { date: 'asc' },
      });

      return invoices.map(inv => ({
        docType: 'Purchase Invoice',
        docId: inv.id,
        docName: inv.invoiceNumber,
        date: inv.date,
        dueDate: inv.dueDate,
        totalAmount: Number(inv.netAmount),
        paidAmount: Number(inv.paidAmount),
        outstandingAmount: Number(inv.netAmount) - Number(inv.paidAmount),
      }));
    }
  }

  // =========================================================================
  // HELPER: Update invoice payment status
  // =========================================================================

  private async updateInvoicePaymentStatus(
    invoiceId: string,
    allocatedAmount: number,
    type: 'sales' | 'purchase',
  ) {
    if (type === 'sales') {
      const invoice = await this.prisma.salesInvoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) return;

      const newPaid = Number(invoice.paidAmount) + allocatedAmount;
      const netAmount = Number(invoice.netAmount);

      let status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
      if (newPaid >= netAmount) status = newPaid > netAmount ? 'OVERPAID' : 'PAID';
      else if (newPaid > 0) status = 'PARTIAL';
      else status = 'UNPAID';

      await this.prisma.salesInvoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaid, paymentStatus: status },
      });
    } else {
      const invoice = await this.prisma.purchaseInvoice.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice) return;

      const newPaid = Number(invoice.paidAmount) + allocatedAmount;
      const netAmount = Number(invoice.netAmount);

      let status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
      if (newPaid >= netAmount) status = newPaid > netAmount ? 'OVERPAID' : 'PAID';
      else if (newPaid > 0) status = 'PARTIAL';
      else status = 'UNPAID';

      await this.prisma.purchaseInvoice.update({
        where: { id: invoiceId },
        data: { paidAmount: newPaid, paymentStatus: status },
      });
    }
  }
}
