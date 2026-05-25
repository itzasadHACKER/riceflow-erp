import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface InvoiceItemDto {
  riceVarietyId?: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  taxRate?: number;
  warehouseId?: string;
  lotNumber?: string;
  bagCount?: number;
  bagWeight?: number;
}

interface CreateSalesInvoiceWithItemsDto {
  date: string;
  customerId: string;
  salesOrderId?: string;
  dueDate?: string;
  discount?: number;
  items: InvoiceItemDto[];
  notes?: string;
}

interface RecordPaymentDto {
  date: string;
  direction: 'RECEIVED' | 'MADE';
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: string;
  partyName: string;
  paymentMode: string;
  totalAmount: number;
  invoiceId?: string;
  invoiceNumber?: string;
  bankAccountId?: string;
  chequeNumber?: string;
  referenceNumber?: string;
  narration?: string;
}

interface CreateWeighbridgeSlipDto {
  date: string;
  vehicleNumber: string;
  driverName?: string;
  partyName: string;
  partyType?: string;
  partyId?: string;
  materialType?: string;
  riceVarietyId?: string;
  grossWeight: number;
  tareWeight?: number;
  operator?: string;
  notes?: string;
}

interface BardanaDto {
  date: string;
  transactionType: 'ISSUED' | 'RECEIVED' | 'PURCHASED' | 'SOLD' | 'RETURNED' | 'DAMAGED';
  partyType?: string;
  partyId?: string;
  partyName: string;
  bagType?: string;
  quantity: number;
  rate?: number;
  referenceDoc?: string;
  referenceDocId?: string;
  notes?: string;
}

interface PurchaseInvoiceItemDto {
  riceVarietyId?: string;
  itemCode?: string;
  itemName?: string;
  description: string;
  quantity: number;
  unit?: string;
  stockUom?: string;
  conversionFactor?: number;
  priceListRate?: number;
  rate: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxRate?: number;
  expenseAccountId?: string;
  costCenterId?: string;
  projectId?: string;
  warehouseId?: string;
  lotNumber?: string;
  batchNo?: string;
  serialNo?: string;
  bagCount?: number;
  bagWeight?: number;
}

interface CreatePurchaseInvoiceDto {
  date: string;
  postingTime?: string;
  namingSeries?: string;
  branchId?: string;
  supplierId: string;
  supplierName?: string;
  supplierAddress?: string;
  contactPerson?: string;
  contactEmail?: string;
  shippingAddress?: string;
  vendorInvoiceNo?: string;
  currency?: string;
  exchangeRate?: number;
  priceListId?: string;
  costCenterId?: string;
  projectId?: string;
  dueDate?: string;
  discount?: number;
  discountPercentage?: number;
  applyDiscountOn?: string;
  taxTemplateId?: string;
  taxesAndCharges?: any;
  writeOffAmount?: number;
  creditToId?: string;
  paymentTerms?: string;
  paymentTermsDays?: number;
  additionalCosts?: any;
  termsAndConditions?: string;
  remarks?: string;
  isReturn?: boolean;
  returnAgainst?: string;
  items: PurchaseInvoiceItemDto[];
  notes?: string;
}

@Injectable()
export class Phase1CoreService {
  constructor(private readonly prisma: PrismaService) {}

  // ===================================================================
  // 1. SALES INVOICE WITH LINE ITEMS
  // ===================================================================

  async createSalesInvoiceWithItems(
    organizationId: string,
    userId: string,
    dto: CreateSalesInvoiceWithItemsDto,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.salesInvoice.count({ where: { organizationId } });
      const invoiceNumber = `SI-${String(count + 1).padStart(6, '0')}`;

      let totalAmount = new Prisma.Decimal(0);
      let totalTax = new Prisma.Decimal(0);

      const itemsData = dto.items.map((item) => {
        const qty = new Prisma.Decimal(item.quantity);
        const rate = new Prisma.Decimal(item.rate);
        const amount = qty.mul(rate);
        const taxRate = new Prisma.Decimal(item.taxRate || 0);
        const taxAmount = amount.mul(taxRate).div(100);
        const netAmount = amount.add(taxAmount);

        totalAmount = totalAmount.add(amount);
        totalTax = totalTax.add(taxAmount);

        return {
          riceVarietyId: item.riceVarietyId || null,
          description: item.description,
          quantity: qty,
          unit: item.unit || 'KG',
          rate,
          amount,
          taxRate,
          taxAmount,
          netAmount,
          warehouseId: item.warehouseId || null,
          lotNumber: item.lotNumber || null,
          bagCount: item.bagCount || null,
          bagWeight: item.bagWeight ? new Prisma.Decimal(item.bagWeight) : null,
        };
      });

      const discount = new Prisma.Decimal(dto.discount || 0);
      const netAmount = totalAmount.sub(discount).add(totalTax);

      const invoice = await tx.salesInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          date: new Date(dto.date),
          customerId: dto.customerId,
          salesOrderId: dto.salesOrderId || null,
          totalAmount,
          discount,
          taxAmount: totalTax,
          netAmount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          createdBy: userId,
          items: { create: itemsData },
        },
        include: { customer: true, items: { include: { riceVariety: true } } },
      });

      return invoice;
    });
  }

  async postSalesInvoice(
    organizationId: string,
    userId: string,
    invoiceId: string,
    fiscalYearId: string,
  ) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { customer: true, items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.journalEntryId) throw new BadRequestException('Invoice already posted');

    return this.prisma.$transaction(async (tx) => {
      const receivable = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1130' },
      });
      const salesRevenue = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '4100' },
      });
      if (!receivable || !salesRevenue) {
        throw new NotFoundException('Required accounts (1130 Receivable, 4100 Sales) not found');
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

      const lines: { accountId: string; debit: number; credit: number; narration: string }[] = [
        {
          accountId: receivable.id,
          debit: Number(invoice.netAmount),
          credit: 0,
          narration: `Receivable from ${invoice.customer.name}`,
        },
        {
          accountId: salesRevenue.id,
          debit: 0,
          credit: Number(invoice.netAmount),
          narration: `Sales revenue - ${invoice.invoiceNumber}`,
        },
      ];

      if (Number(invoice.taxAmount) > 0) {
        const taxAccount = await tx.chartOfAccount.findFirst({
          where: { organizationId, code: '2120' },
        });
        if (taxAccount) {
          lines[1].credit = Number(invoice.totalAmount) - Number(invoice.discount);
          lines.push({
            accountId: taxAccount.id,
            debit: 0,
            credit: Number(invoice.taxAmount),
            narration: `GST/Tax payable - ${invoice.invoiceNumber}`,
          });
        }
      }

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(invoice.date),
          reference: invoice.invoiceNumber,
          narration: `Sales invoice ${invoice.invoiceNumber} to ${invoice.customer.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: { create: lines },
        },
      });

      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { journalEntryId: journalEntry.id },
      });

      // --- AUTO INVENTORY DEDUCTION ---
      for (const item of invoice.items) {
        if (item.warehouseId && item.riceVarietyId) {
          const invItem = await tx.inventoryItem.findFirst({
            where: {
              organizationId,
              warehouseId: item.warehouseId,
              riceVarietyId: item.riceVarietyId,
              ...(item.lotNumber ? { lotNumber: item.lotNumber } : {}),
            },
          });
          if (invItem) {
            const newQty = invItem.quantity.sub(item.quantity);
            await tx.inventoryItem.update({
              where: { id: invItem.id },
              data: {
                quantity: newQty.lessThan(0) ? new Prisma.Decimal(0) : newQty,
                totalValue: newQty.lessThan(0)
                  ? new Prisma.Decimal(0)
                  : newQty.mul(invItem.valuationRate),
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              organizationId,
              sourceWarehouseId: item.warehouseId,
              riceVarietyId: item.riceVarietyId,
              movementType: 'OUT',
              quantity: item.quantity,
              movementDate: new Date(invoice.date),
              referenceType: 'SALES_INVOICE',
              referenceId: invoice.id,
              narration: `Sales to ${invoice.customer.name} - ${item.description}`,
              createdBy: userId,
            },
          });
        }
      }

      return { invoice, journalEntry };
    });
  }

  async getSalesInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        salesOrder: true,
        items: { include: { riceVariety: true } },
        journalEntry: { include: { lines: { include: { account: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  // ===================================================================
  // 2. INVENTORY AUTO-MOVEMENT ON PURCHASE
  // ===================================================================

  async postPaddyPurchaseWithStock(
    organizationId: string,
    userId: string,
    purchaseId: string,
    fiscalYearId: string,
    warehouseId: string,
  ) {
    const purchase = await this.prisma.paddyPurchase.findFirst({
      where: { id: purchaseId, organizationId },
      include: { supplier: true, riceVariety: true },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.journalEntryId) throw new BadRequestException('Purchase already posted');

    return this.prisma.$transaction(async (tx) => {
      // Post to accounts
      const purchaseAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '5100' },
      });
      const payableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2110' },
      });
      const inventoryAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1140' },
      });
      if (!purchaseAccount || !payableAccount || !inventoryAccount) {
        throw new NotFoundException('Required accounts not found');
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(purchase.date),
          reference: purchase.purchaseNumber,
          narration: `Paddy purchase ${purchase.purchaseNumber} from ${purchase.supplier.name}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: inventoryAccount.id,
                debit: Number(purchase.netAmount),
                credit: 0,
                narration: `Paddy inventory - ${purchase.riceVariety.name}`,
              },
              {
                accountId: payableAccount.id,
                debit: 0,
                credit: Number(purchase.netAmount),
                narration: `Payable to ${purchase.supplier.name}`,
              },
            ],
          },
        },
      });

      await tx.paddyPurchase.update({
        where: { id: purchaseId },
        data: { journalEntryId: journalEntry.id },
      });

      // --- AUTO STOCK IN ---
      const lotNumber = purchase.lotNumber || purchase.purchaseNumber;
      const finalWeight = new Prisma.Decimal(Number(purchase.finalWeight));
      const rate = new Prisma.Decimal(Number(purchase.ratePerUnit));

      const existingItem = await tx.inventoryItem.findFirst({
        where: { organizationId, warehouseId, riceVarietyId: purchase.riceVarietyId, lotNumber },
      });

      if (existingItem) {
        const newQty = existingItem.quantity.add(finalWeight);
        await tx.inventoryItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQty, totalValue: newQty.mul(rate) },
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            organizationId,
            warehouseId,
            riceVarietyId: purchase.riceVarietyId,
            lotNumber,
            quantity: finalWeight,
            unit: 'KG',
            valuationRate: rate,
            totalValue: finalWeight.mul(rate),
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          organizationId,
          destinationWarehouseId: warehouseId,
          riceVarietyId: purchase.riceVarietyId,
          movementType: 'IN',
          quantity: finalWeight,
          movementDate: new Date(purchase.date),
          referenceType: 'PADDY_PURCHASE',
          referenceId: purchase.id,
          narration: `Paddy from ${purchase.supplier.name} - ${purchase.riceVariety.name}`,
          createdBy: userId,
        },
      });

      return { purchase, journalEntry };
    });
  }

  // ===================================================================
  // 3. PAYMENT RECORDING AGAINST INVOICES
  // ===================================================================

  async recordPayment(organizationId: string, userId: string, dto: RecordPaymentDto) {
    if (dto.totalAmount <= 0) throw new BadRequestException('Amount must be positive');

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.paymentAllocation.count({ where: { organizationId } });
      const allocationNumber = `PAY-${String(count + 1).padStart(6, '0')}`;

      const allocation = await tx.paymentAllocation.create({
        data: {
          organizationId,
          allocationNumber,
          date: new Date(dto.date),
          direction: dto.direction,
          partyType: dto.partyType,
          partyId: dto.partyId,
          partyName: dto.partyName,
          paymentMode: dto.paymentMode,
          totalAmount: dto.totalAmount,
          invoiceId: dto.invoiceId || null,
          invoiceNumber: dto.invoiceNumber || null,
          bankAccountId: dto.bankAccountId || null,
          chequeNumber: dto.chequeNumber || null,
          referenceNumber: dto.referenceNumber || null,
          narration: dto.narration || null,
          createdBy: userId,
        },
      });

      // Update invoice payment status
      if (dto.invoiceId && dto.direction === 'RECEIVED') {
        const invoice = await tx.salesInvoice.findFirst({
          where: { id: dto.invoiceId, organizationId },
        });
        if (invoice) {
          const newPaid = Number(invoice.paidAmount) + dto.totalAmount;
          const netAmount = Number(invoice.netAmount);
          const status = newPaid >= netAmount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';
          await tx.salesInvoice.update({
            where: { id: dto.invoiceId },
            data: {
              paidAmount: newPaid,
              paymentStatus: status as 'PAID' | 'PARTIAL' | 'UNPAID',
            },
          });
        }
      }

      if (dto.invoiceId && dto.direction === 'MADE') {
        const purchaseInv = await tx.purchaseInvoice.findFirst({
          where: { id: dto.invoiceId, organizationId },
        });
        if (purchaseInv) {
          const newPaid = Number(purchaseInv.paidAmount) + dto.totalAmount;
          const netAmount = Number(purchaseInv.netAmount);
          const status = newPaid >= netAmount ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID';
          await tx.purchaseInvoice.update({
            where: { id: dto.invoiceId },
            data: {
              paidAmount: newPaid,
              paymentStatus: status as 'PAID' | 'PARTIAL' | 'UNPAID',
            },
          });
        }
      }

      return allocation;
    });
  }

  async postPayment(organizationId: string, userId: string, allocationId: string, fiscalYearId: string) {
    const allocation = await this.prisma.paymentAllocation.findFirst({
      where: { id: allocationId, organizationId },
    });
    if (!allocation) throw new NotFoundException('Payment not found');
    if (allocation.isPosted) throw new BadRequestException('Payment already posted');

    return this.prisma.$transaction(async (tx) => {
      let debitAccountCode: string;
      let creditAccountCode: string;

      if (allocation.direction === 'RECEIVED') {
        debitAccountCode = allocation.paymentMode === 'CASH' ? '1001' : '1002';
        creditAccountCode = '1130'; // Accounts Receivable
      } else {
        debitAccountCode = '2110'; // Accounts Payable
        creditAccountCode = allocation.paymentMode === 'CASH' ? '1001' : '1002';
      }

      const debitAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: debitAccountCode },
      });
      const creditAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: creditAccountCode },
      });
      if (!debitAccount || !creditAccount) {
        throw new NotFoundException(`Required accounts not found (${debitAccountCode}, ${creditAccountCode})`);
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(allocation.date),
          reference: allocation.allocationNumber,
          narration: `Payment ${allocation.direction === 'RECEIVED' ? 'from' : 'to'} ${allocation.partyName}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: debitAccount.id,
                debit: Number(allocation.totalAmount),
                credit: 0,
                narration: `${allocation.direction === 'RECEIVED' ? 'Cash/Bank received' : 'Payable cleared'}`,
              },
              {
                accountId: creditAccount.id,
                debit: 0,
                credit: Number(allocation.totalAmount),
                narration: `${allocation.direction === 'RECEIVED' ? 'Receivable cleared' : 'Cash/Bank paid'}`,
              },
            ],
          },
        },
      });

      await tx.paymentAllocation.update({
        where: { id: allocationId },
        data: { isPosted: true, journalEntryId: journalEntry.id },
      });

      return { allocation, journalEntry };
    });
  }

  async getPayments(organizationId: string, partyId?: string, direction?: string) {
    const where: Prisma.PaymentAllocationWhereInput = {
      organizationId,
      ...(partyId ? { partyId } : {}),
      ...(direction ? { direction: direction as 'RECEIVED' | 'MADE' } : {}),
    };
    return this.prisma.paymentAllocation.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  // ===================================================================
  // 4. CUSTOMER / SUPPLIER KHATA (LEDGER)
  // ===================================================================

  async getPartyLedger(
    organizationId: string,
    partyType: 'CUSTOMER' | 'SUPPLIER',
    partyId: string,
    fromDate?: string,
    toDate?: string,
  ) {
    if (partyType === 'CUSTOMER') {
      return this.getCustomerKhata(organizationId, partyId, fromDate, toDate);
    }
    return this.getSupplierKhata(organizationId, partyId, fromDate, toDate);
  }

  private async getCustomerKhata(orgId: string, customerId: string, fromDate?: string, toDate?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId: orgId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const dateFilter = this.buildDateFilter(fromDate, toDate);

    const [invoices, payments, creditNotes, salesReturns] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where: { organizationId: orgId, customerId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, invoiceNumber: true, date: true, netAmount: true, paymentStatus: true, paidAmount: true },
      }),
      this.prisma.paymentAllocation.findMany({
        where: { organizationId: orgId, partyId: customerId, direction: 'RECEIVED', ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, allocationNumber: true, date: true, totalAmount: true, paymentMode: true },
      }),
      this.prisma.creditNote.findMany({
        where: { organizationId: orgId, customerId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, noteNumber: true, date: true, netAmount: true },
      }),
      this.prisma.salesReturn.findMany({
        where: { organizationId: orgId, customerId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, returnNumber: true, date: true, totalAmount: true },
      }),
    ]);

    type LedgerEntry = {
      date: Date;
      type: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    };

    const entries: LedgerEntry[] = [];

    // Opening balance
    entries.push({
      date: fromDate ? new Date(fromDate) : new Date('2000-01-01'),
      type: 'OPENING',
      reference: '-',
      description: 'Opening Balance',
      debit: Number(customer.openingBalance) > 0 ? Number(customer.openingBalance) : 0,
      credit: Number(customer.openingBalance) < 0 ? Math.abs(Number(customer.openingBalance)) : 0,
    });

    for (const inv of invoices) {
      entries.push({
        date: inv.date,
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        description: `Sales Invoice`,
        debit: Number(inv.netAmount),
        credit: 0,
      });
    }

    for (const pay of payments) {
      entries.push({
        date: pay.date,
        type: 'PAYMENT',
        reference: pay.allocationNumber,
        description: `Payment Received (${pay.paymentMode})`,
        debit: 0,
        credit: Number(pay.totalAmount),
      });
    }

    for (const cn of creditNotes) {
      entries.push({
        date: cn.date,
        type: 'CREDIT_NOTE',
        reference: cn.noteNumber,
        description: `Credit Note`,
        debit: 0,
        credit: Number(cn.netAmount),
      });
    }

    for (const sr of salesReturns) {
      entries.push({
        date: sr.date,
        type: 'SALES_RETURN',
        reference: sr.returnNumber,
        description: `Sales Return`,
        debit: 0,
        credit: Number(sr.totalAmount),
      });
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    const ledger = entries.map((e) => {
      runningBalance += e.debit - e.credit;
      return { ...e, balance: runningBalance, balanceType: runningBalance >= 0 ? 'DR' : 'CR' as string };
    });

    return {
      party: { id: customer.id, name: customer.name, type: 'CUSTOMER' },
      openingBalance: Number(customer.openingBalance),
      closingBalance: runningBalance,
      closingBalanceType: runningBalance >= 0 ? 'DR' : 'CR',
      totalDebit: entries.reduce((s, e) => s + e.debit, 0),
      totalCredit: entries.reduce((s, e) => s + e.credit, 0),
      entries: ledger,
    };
  }

  private async getSupplierKhata(orgId: string, supplierId: string, fromDate?: string, toDate?: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId: orgId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const dateFilter = this.buildDateFilter(fromDate, toDate);

    const [purchases, payments, debitNotes, purchaseReturns] = await Promise.all([
      this.prisma.paddyPurchase.findMany({
        where: { organizationId: orgId, supplierId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, purchaseNumber: true, date: true, netAmount: true },
      }),
      this.prisma.paymentAllocation.findMany({
        where: { organizationId: orgId, partyId: supplierId, direction: 'MADE', ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, allocationNumber: true, date: true, totalAmount: true, paymentMode: true },
      }),
      this.prisma.debitNote.findMany({
        where: { organizationId: orgId, supplierId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, noteNumber: true, date: true, netAmount: true },
      }),
      this.prisma.purchaseReturn.findMany({
        where: { organizationId: orgId, supplierId, ...dateFilter },
        orderBy: { date: 'asc' },
        select: { id: true, returnNumber: true, date: true, totalAmount: true },
      }),
    ]);

    type LedgerEntry = {
      date: Date;
      type: string;
      reference: string;
      description: string;
      debit: number;
      credit: number;
    };

    const entries: LedgerEntry[] = [];

    entries.push({
      date: fromDate ? new Date(fromDate) : new Date('2000-01-01'),
      type: 'OPENING',
      reference: '-',
      description: 'Opening Balance',
      debit: Number(supplier.openingBalance) < 0 ? Math.abs(Number(supplier.openingBalance)) : 0,
      credit: Number(supplier.openingBalance) > 0 ? Number(supplier.openingBalance) : 0,
    });

    for (const p of purchases) {
      entries.push({
        date: p.date,
        type: 'PURCHASE',
        reference: p.purchaseNumber,
        description: `Paddy Purchase`,
        debit: 0,
        credit: Number(p.netAmount),
      });
    }

    for (const pay of payments) {
      entries.push({
        date: pay.date,
        type: 'PAYMENT',
        reference: pay.allocationNumber,
        description: `Payment Made (${pay.paymentMode})`,
        debit: Number(pay.totalAmount),
        credit: 0,
      });
    }

    for (const dn of debitNotes) {
      entries.push({
        date: dn.date,
        type: 'DEBIT_NOTE',
        reference: dn.noteNumber,
        description: `Debit Note`,
        debit: Number(dn.netAmount),
        credit: 0,
      });
    }

    for (const pr of purchaseReturns) {
      entries.push({
        date: pr.date,
        type: 'PURCHASE_RETURN',
        reference: pr.returnNumber,
        description: `Purchase Return`,
        debit: Number(pr.totalAmount),
        credit: 0,
      });
    }

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    const ledger = entries.map((e) => {
      runningBalance += e.credit - e.debit;
      return { ...e, balance: Math.abs(runningBalance), balanceType: runningBalance >= 0 ? 'CR' : 'DR' as string };
    });

    return {
      party: { id: supplier.id, name: supplier.name, type: 'SUPPLIER' },
      openingBalance: Number(supplier.openingBalance),
      closingBalance: Math.abs(runningBalance),
      closingBalanceType: runningBalance >= 0 ? 'CR' : 'DR',
      totalDebit: entries.reduce((s, e) => s + e.debit, 0),
      totalCredit: entries.reduce((s, e) => s + e.credit, 0),
      entries: ledger,
    };
  }

  async getPartyBalance(organizationId: string, partyType: string, partyId: string) {
    const ledger = await this.getPartyLedger(
      organizationId,
      partyType as 'CUSTOMER' | 'SUPPLIER',
      partyId,
    );
    return {
      partyName: ledger.party.name,
      closingBalance: ledger.closingBalance,
      balanceType: ledger.closingBalanceType,
    };
  }

  // ===================================================================
  // 5. WEIGHBRIDGE SLIP
  // ===================================================================

  async createWeighbridgeSlip(organizationId: string, userId: string, dto: CreateWeighbridgeSlipDto) {
    const netWeight = dto.grossWeight - (dto.tareWeight || 0);
    if (netWeight <= 0) throw new BadRequestException('Net weight must be positive');

    const count = await this.prisma.weighbridgeSlip.count({ where: { organizationId } });
    const slipNumber = `WB-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.weighbridgeSlip.create({
      data: {
        organizationId,
        slipNumber,
        date: new Date(dto.date),
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        partyName: dto.partyName,
        partyType: dto.partyType || 'SUPPLIER',
        partyId: dto.partyId || null,
        materialType: dto.materialType || 'PADDY',
        riceVarietyId: dto.riceVarietyId || null,
        grossWeight: dto.grossWeight,
        tareWeight: dto.tareWeight || 0,
        netWeight,
        grossWeighTime: new Date(),
        operator: dto.operator || null,
        notes: dto.notes || null,
      },
      include: { riceVariety: true },
    });
  }

  async recordTareWeight(organizationId: string, slipId: string, tareWeight: number) {
    const slip = await this.prisma.weighbridgeSlip.findFirst({
      where: { id: slipId, organizationId },
    });
    if (!slip) throw new NotFoundException('Weighbridge slip not found');

    const netWeight = Number(slip.grossWeight) - tareWeight;
    if (netWeight <= 0) throw new BadRequestException('Net weight must be positive');

    return this.prisma.weighbridgeSlip.update({
      where: { id: slipId },
      data: { tareWeight, netWeight, tareWeighTime: new Date() },
      include: { riceVariety: true },
    });
  }

  async getWeighbridgeSlips(organizationId: string, date?: string, vehicleNumber?: string) {
    const where: Prisma.WeighbridgeSlipWhereInput = {
      organizationId,
      ...(date ? { date: new Date(date) } : {}),
      ...(vehicleNumber ? { vehicleNumber: { contains: vehicleNumber, mode: 'insensitive' as const } } : {}),
    };
    return this.prisma.weighbridgeSlip.findMany({
      where,
      include: { riceVariety: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWeighbridgeSlip(organizationId: string, id: string) {
    const slip = await this.prisma.weighbridgeSlip.findFirst({
      where: { id, organizationId },
      include: { riceVariety: true },
    });
    if (!slip) throw new NotFoundException('Weighbridge slip not found');
    return slip;
  }

  // ===================================================================
  // 6. BARDANA (BAG) TRACKING
  // ===================================================================

  async createBardanaTransaction(organizationId: string, userId: string, dto: BardanaDto) {
    if (dto.quantity <= 0) throw new BadRequestException('Quantity must be positive');

    const count = await this.prisma.bardanaTransaction.count({ where: { organizationId } });
    const transactionNumber = `BD-${String(count + 1).padStart(6, '0')}`;
    const amount = dto.quantity * (dto.rate || 0);

    return this.prisma.bardanaTransaction.create({
      data: {
        organizationId,
        transactionNumber,
        date: new Date(dto.date),
        transactionType: dto.transactionType,
        partyType: dto.partyType || 'SUPPLIER',
        partyId: dto.partyId || null,
        partyName: dto.partyName,
        bagType: dto.bagType || 'PP',
        quantity: dto.quantity,
        rate: dto.rate || 0,
        amount,
        referenceDoc: dto.referenceDoc || null,
        referenceDocId: dto.referenceDocId || null,
        notes: dto.notes || null,
        createdBy: userId,
      },
    });
  }

  async getBardanaTransactions(organizationId: string, partyId?: string, bagType?: string) {
    const where: Prisma.BardanaTransactionWhereInput = {
      organizationId,
      ...(partyId ? { partyId } : {}),
      ...(bagType ? { bagType } : {}),
    };
    return this.prisma.bardanaTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getBardanaSummary(organizationId: string, partyId?: string) {
    const where: Prisma.BardanaTransactionWhereInput = {
      organizationId,
      ...(partyId ? { partyId } : {}),
    };
    const transactions = await this.prisma.bardanaTransaction.findMany({ where });

    let totalIssued = 0;
    let totalReceived = 0;
    let totalPurchased = 0;
    let totalSold = 0;
    let totalReturned = 0;
    let totalDamaged = 0;

    for (const t of transactions) {
      switch (t.transactionType) {
        case 'ISSUED': totalIssued += t.quantity; break;
        case 'RECEIVED': totalReceived += t.quantity; break;
        case 'PURCHASED': totalPurchased += t.quantity; break;
        case 'SOLD': totalSold += t.quantity; break;
        case 'RETURNED': totalReturned += t.quantity; break;
        case 'DAMAGED': totalDamaged += t.quantity; break;
      }
    }

    const inStock = totalPurchased + totalReceived + totalReturned - totalIssued - totalSold - totalDamaged;
    const outstanding = totalIssued - totalReceived - totalReturned;

    return {
      totalIssued,
      totalReceived,
      totalPurchased,
      totalSold,
      totalReturned,
      totalDamaged,
      inStock: Math.max(0, inStock),
      outstanding: Math.max(0, outstanding),
      totalTransactions: transactions.length,
    };
  }

  // ===================================================================
  // 7. PURCHASE INVOICE WITH LINE ITEMS (NON-PADDY)
  // ===================================================================

  async createPurchaseInvoice(organizationId: string, userId: string, dto: CreatePurchaseInvoiceDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, organizationId, deletedAt: null },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.purchaseInvoice.count({ where: { organizationId } });
      const invoiceNumber = `PI-${String(count + 1).padStart(6, '0')}`;
      const exchangeRate = new Prisma.Decimal(dto.exchangeRate || 1);

      let totalAmount = new Prisma.Decimal(0);
      let totalTax = new Prisma.Decimal(0);
      let totalQty = new Prisma.Decimal(0);

      const itemsData = dto.items.map((item, idx) => {
        const qty = new Prisma.Decimal(item.quantity);
        const rate = new Prisma.Decimal(item.rate);
        const amount = qty.mul(rate);
        const convFactor = new Prisma.Decimal(item.conversionFactor || 1);
        const stockQty = qty.mul(convFactor);
        const baseRate = rate.mul(exchangeRate);
        const baseAmount = amount.mul(exchangeRate);
        const discPct = new Prisma.Decimal(item.discountPercentage || 0);
        const discAmt = item.discountAmount ? new Prisma.Decimal(item.discountAmount) : (discPct.gt(0) ? amount.mul(discPct).div(100) : new Prisma.Decimal(0));
        const afterDiscount = amount.sub(discAmt);
        const taxRate = new Prisma.Decimal(item.taxRate || 0);
        const taxAmount = afterDiscount.mul(taxRate).div(100);
        const netAmount = afterDiscount.add(taxAmount);
        const netRate = qty.gt(0) ? netAmount.div(qty) : new Prisma.Decimal(0);

        totalAmount = totalAmount.add(amount);
        totalTax = totalTax.add(taxAmount);
        totalQty = totalQty.add(qty);

        return {
          riceVarietyId: item.riceVarietyId || null,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description,
          quantity: qty,
          stockQty,
          unit: item.unit || 'PCS',
          stockUom: item.stockUom || item.unit || 'PCS',
          conversionFactor: convFactor,
          priceListRate: item.priceListRate ? new Prisma.Decimal(item.priceListRate) : rate,
          rate,
          baseRate,
          amount,
          baseAmount,
          discountPercentage: discPct,
          discountAmount: discAmt,
          taxRate,
          taxAmount,
          netAmount,
          netRate,
          expenseAccountId: item.expenseAccountId || null,
          costCenterId: item.costCenterId || null,
          projectId: item.projectId || null,
          warehouseId: item.warehouseId || null,
          lotNumber: item.lotNumber,
          batchNo: item.batchNo,
          serialNo: item.serialNo,
          bagCount: item.bagCount,
          bagWeight: item.bagWeight ? new Prisma.Decimal(item.bagWeight) : null,
          idx,
        };
      });

      const discount = new Prisma.Decimal(dto.discount || 0);
      const discPct = new Prisma.Decimal(dto.discountPercentage || 0);
      const additionalDiscount = discPct.gt(0) ? totalAmount.mul(discPct).div(100) : discount;
      const netTotal = totalAmount.sub(additionalDiscount);
      const grandTotal = netTotal.add(totalTax);
      const writeOff = new Prisma.Decimal(dto.writeOffAmount || 0);
      const netAmount = grandTotal.sub(writeOff);
      const outstandingAmount = netAmount;

      return tx.purchaseInvoice.create({
        data: {
          organizationId,
          branchId: dto.branchId || null,
          invoiceNumber,
          namingSeries: dto.namingSeries,
          vendorInvoiceNo: dto.vendorInvoiceNo || null,
          date: new Date(dto.date),
          postingTime: dto.postingTime,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          isReturn: dto.isReturn ?? false,
          returnAgainst: dto.returnAgainst,
          supplierId: dto.supplierId,
          supplierName: dto.supplierName ?? supplier.name,
          supplierAddress: dto.supplierAddress,
          contactPerson: dto.contactPerson,
          contactEmail: dto.contactEmail,
          shippingAddress: dto.shippingAddress,
          currency: dto.currency ?? 'PKR',
          exchangeRate,
          priceListId: dto.priceListId || null,
          costCenterId: dto.costCenterId || null,
          projectId: dto.projectId || null,
          totalQty,
          totalAmount,
          netTotal,
          discountPercentage: discPct,
          discount: additionalDiscount,
          applyDiscountOn: dto.applyDiscountOn,
          taxTemplateId: dto.taxTemplateId || null,
          taxesAndCharges: dto.taxesAndCharges ?? [],
          taxAmount: totalTax,
          grandTotal,
          netAmount,
          outstandingAmount,
          paidAmount: 0,
          writeOffAmount: writeOff,
          creditToId: dto.creditToId || null,
          paymentTerms: dto.paymentTerms,
          paymentTermsDays: dto.paymentTermsDays,
          additionalCosts: dto.additionalCosts ?? [],
          termsAndConditions: dto.termsAndConditions,
          remarks: dto.remarks,
          notes: dto.notes || null,
          createdBy: userId,
          items: { create: itemsData },
        },
        include: { supplier: true, items: true },
      });
    });
  }

  async getPurchaseInvoices(organizationId: string, supplierId?: string) {
    const where: Prisma.PurchaseInvoiceWhereInput = {
      organizationId,
      ...(supplierId ? { supplierId } : {}),
    };
    return this.prisma.purchaseInvoice.findMany({
      where,
      include: { supplier: true, items: true },
      orderBy: { date: 'desc' },
    });
  }

  async getPurchaseInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, organizationId },
      include: { supplier: true, items: true },
    });
    if (!invoice) throw new NotFoundException('Purchase invoice not found');
    return invoice;
  }

  // ===================================================================
  // 8. GST TAX CALCULATION HELPER
  // ===================================================================

  async getApplicableTaxRate(organizationId: string, itemType?: string): Promise<number> {
    const taxConfig = await this.prisma.taxConfiguration.findFirst({
      where: {
        organizationId,
        isActive: true,
        ...(itemType ? { name: { contains: itemType, mode: 'insensitive' as const } } : {}),
      },
    });
    return taxConfig ? Number(taxConfig.rate) : 0;
  }

  // ===================================================================
  // HELPERS
  // ===================================================================

  private buildDateFilter(fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return {};
    const filter: { date?: { gte?: Date; lte?: Date } } = { date: {} };
    if (fromDate) filter.date!.gte = new Date(fromDate);
    if (toDate) filter.date!.lte = new Date(toDate);
    return filter;
  }
}
