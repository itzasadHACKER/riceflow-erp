import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateSalesOrderDto,
  CreateSalesInvoiceDto,
  CreateDeliveryChallanDto,
} from './dto/sales.dto';
import { GeneralLedgerService } from '../accounting-engine/general-ledger.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(GeneralLedgerService) private readonly glService?: GeneralLedgerService,
  ) {}

  // ===== CUSTOMERS =====

  async createCustomer(organizationId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        organizationId,
        name: dto.name,
        customerCode: dto.customerCode,
        customerName: dto.customerName,
        customerGroup: dto.customerGroup,
        territory: dto.territory,
        company: dto.company,
        phone: dto.phone,
        mobileNo: dto.mobileNo,
        email: dto.email,
        website: dto.website,
        address: dto.address,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        customerType: dto.customerType ?? 'DEALER',
        cnic: dto.cnic,
        ntn: dto.ntn,
        salesTaxNo: dto.salesTaxNo,
        fax: dto.fax,
        gstCategory: dto.gstCategory,
        gstNo: dto.gstNo,
        taxId: dto.taxId,
        taxWithholdingCategory: dto.taxWithholdingCategory,
        paymentTermsDays: dto.paymentTermsDays,
        creditLimit: dto.creditLimit ?? 0,
        openingBalance: dto.openingBalance ?? 0,
        defaultCurrency: dto.defaultCurrency ?? 'PKR',
        defaultReceivableAccountId: dto.defaultReceivableAccountId,
        defaultPriceListId: dto.defaultPriceListId,
        defaultBankAccountId: dto.defaultBankAccountId,
        defaultSalespersonId: dto.defaultSalespersonId,
        contactPerson: dto.contactPerson,
        loyaltyProgram: dto.loyaltyProgram,
      },
    });
  }

  async listCustomers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const where: Prisma.CustomerWhereInput = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getCustomer(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        _count: { select: { salesOrders: true, salesInvoices: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async updateCustomer(
    organizationId: string,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    await this.getCustomer(organizationId, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  // ===== SALES ORDERS =====

  async createSalesOrder(
    organizationId: string,
    userId: string,
    dto: CreateSalesOrderDto,
  ) {
    await this.getCustomer(organizationId, dto.customerId);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Sales order must have at least one item');
    }

    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumber(tx, organizationId);

      let totalAmount = 0;
      let totalQty = 0;
      let totalTaxAmount = 0;
      const exchangeRate = dto.exchangeRate ?? 1;

      const itemsData = dto.items.map((item, idx) => {
        const qty = item.quantity;
        const rate = item.rate;
        const amount = qty * rate;
        const conversionFactor = item.conversionFactor ?? 1;
        const stockQty = qty * conversionFactor;
        const baseRate = rate * exchangeRate;
        const baseAmount = amount * exchangeRate;
        const discPct = item.discountPercentage ?? 0;
        const discAmt = item.discountAmount ?? (discPct > 0 ? amount * discPct / 100 : 0);
        const afterDiscount = amount - discAmt;
        const taxRate = item.taxRate ?? 0;
        const taxAmt = afterDiscount * taxRate / 100;
        const netAmt = afterDiscount + taxAmt;
        const netRate = qty > 0 ? netAmt / qty : 0;

        totalAmount += amount;
        totalQty += qty;
        totalTaxAmount += taxAmt;

        return {
          riceVarietyId: item.riceVarietyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.description,
          quantity: qty,
          stockQty,
          unit: item.unit ?? 'KG',
          stockUom: item.stockUom ?? item.unit ?? 'KG',
          conversionFactor,
          priceListRate: item.priceListRate ?? rate,
          rate,
          baseRate,
          amount,
          baseAmount,
          discountPercentage: discPct,
          discountAmount: discAmt,
          taxRate,
          taxAmount: taxAmt,
          netAmount: netAmt,
          netRate,
          lotNumber: item.lotNumber,
          batchNo: item.batchNo,
          warehouseId: item.warehouseId,
          costCenterId: item.costCenterId,
          projectId: item.projectId,
          deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : null,
          bagCount: item.bagCount,
          bagWeight: item.bagWeight,
          idx,
        };
      });

      const discount = dto.discount ?? 0;
      const discountPct = dto.discountPercentage ?? 0;
      const additionalDiscount = discountPct > 0 ? totalAmount * discountPct / 100 : discount;
      const taxAmount = dto.taxAmount ?? totalTaxAmount;
      const netTotal = totalAmount - additionalDiscount;
      const grandTotal = netTotal + taxAmount;
      const roundingAdj = Math.round(grandTotal) - grandTotal;
      const roundedTotal = grandTotal + roundingAdj;
      const netAmount = roundedTotal;

      return tx.salesOrder.create({
        data: {
          organizationId,
          branchId: dto.branchId,
          orderNumber,
          namingSeries: dto.namingSeries,
          date: new Date(dto.date),
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerAddress: dto.customerAddress,
          contactPerson: dto.contactPerson,
          contactEmail: dto.contactEmail,
          contactMobile: dto.contactMobile,
          shippingAddress: dto.shippingAddress,
          currency: dto.currency ?? 'PKR',
          exchangeRate,
          priceListId: dto.priceListId,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          totalQty,
          totalAmount,
          netTotal,
          discountPercentage: discountPct,
          discount: additionalDiscount,
          applyDiscountOn: dto.applyDiscountOn,
          taxTemplateId: dto.taxTemplateId,
          taxesAndCharges: dto.taxesAndCharges ?? [],
          taxAmount,
          grandTotal,
          roundingAdjustment: roundingAdj,
          roundedTotal,
          inWords: dto.inWords,
          netAmount,
          salespersonId: dto.salespersonId,
          commissionRate: dto.commissionRate ?? 0,
          totalCommission: dto.commissionRate ? (netAmount * dto.commissionRate / 100) : 0,
          paymentTerms: dto.paymentTerms,
          paymentTermsDays: dto.paymentTermsDays,
          letterHead: dto.letterHead,
          termsAndConditions: dto.termsAndConditions,
          notes: dto.notes,
          remarks: dto.remarks,
          createdBy: userId,
          items: { create: itemsData },
        },
        include: {
          customer: true,
          branch: true,
          items: { include: { riceVariety: true } },
        },
      });
    });
  }

  async confirmSalesOrder(organizationId: string, id: string) {
    const order = await this.getSalesOrder(organizationId, id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Only draft orders can be confirmed');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { customer: true, items: { include: { riceVariety: true } } },
    });
  }

  async dispatchSalesOrder(organizationId: string, id: string) {
    const order = await this.getSalesOrder(organizationId, id);
    if (order.status !== 'CONFIRMED' && order.status !== 'PROCESSING') {
      throw new BadRequestException(
        'Only confirmed/processing orders can be dispatched',
      );
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'DISPATCHED' },
      include: { customer: true, items: { include: { riceVariety: true } } },
    });
  }

  async deliverSalesOrder(organizationId: string, id: string) {
    const order = await this.getSalesOrder(organizationId, id);
    if (order.status !== 'DISPATCHED') {
      throw new BadRequestException('Only dispatched orders can be delivered');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'DELIVERED' },
      include: { customer: true, items: { include: { riceVariety: true } } },
    });
  }

  async cancelSalesOrder(organizationId: string, id: string) {
    const order = await this.getSalesOrder(organizationId, id);
    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel a delivered order');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { customer: true },
    });
  }

  async listSalesOrders(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    customerId?: string,
    status?: string,
  ) {
    const where: Prisma.SalesOrderWhereInput = {
      organizationId,
      deletedAt: null,
      ...(customerId ? { customerId } : {}),
      ...(status
        ? {
            status: status as
              | 'DRAFT'
              | 'CONFIRMED'
              | 'PROCESSING'
              | 'DISPATCHED'
              | 'DELIVERED'
              | 'CANCELLED',
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        include: {
          customer: true,
          branch: true,
          items: { include: { riceVariety: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getSalesOrder(organizationId: string, id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        customer: true,
        branch: true,
        items: { include: { riceVariety: true, warehouse: true } },
        salesInvoices: true,
        deliveryChallans: true,
      },
    });
    if (!order) throw new NotFoundException('Sales order not found');
    return order;
  }

  // ===== SALES INVOICES =====

  async createSalesInvoice(
    organizationId: string,
    userId: string,
    dto: CreateSalesInvoiceDto,
  ) {
    await this.getCustomer(organizationId, dto.customerId);

    return this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(
        tx,
        organizationId,
      );

      const exchangeRate = dto.exchangeRate ?? 1;
      let totalAmount = 0;
      let totalQty = 0;
      let totalTaxAmount = 0;

      const itemsData = (dto.items ?? []).map((item, idx) => {
        const qty = item.quantity;
        const rate = item.rate;
        const amount = qty * rate;
        const conversionFactor = item.conversionFactor ?? 1;
        const stockQty = qty * conversionFactor;
        const baseRate = rate * exchangeRate;
        const baseAmount = amount * exchangeRate;
        const discPct = item.discountPercentage ?? 0;
        const discAmt = item.discountAmount ?? (discPct > 0 ? amount * discPct / 100 : 0);
        const afterDiscount = amount - discAmt;
        const taxRate = item.taxRate ?? 0;
        const taxAmt = afterDiscount * taxRate / 100;
        const netAmt = afterDiscount + taxAmt;
        const netRate = qty > 0 ? netAmt / qty : 0;

        totalAmount += amount;
        totalQty += qty;
        totalTaxAmount += taxAmt;

        return {
          riceVarietyId: item.riceVarietyId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          description: item.itemName ?? '',
          quantity: qty,
          stockQty,
          unit: item.unit ?? 'KG',
          stockUom: item.stockUom ?? item.unit ?? 'KG',
          conversionFactor,
          priceListRate: item.priceListRate ?? rate,
          rate,
          baseRate,
          amount,
          baseAmount,
          discountPercentage: discPct,
          discountAmount: discAmt,
          taxRate,
          taxAmount: taxAmt,
          netAmount: netAmt,
          netRate,
          warehouseId: item.warehouseId,
          costCenterId: item.costCenterId,
          projectId: item.projectId,
          incomeAccountId: item.incomeAccountId,
          expenseAccountId: item.expenseAccountId,
          lotNumber: item.lotNumber,
          batchNo: item.batchNo,
          serialNo: item.serialNo,
          salesOrderItemId: item.salesOrderItemId,
          idx,
        };
      });

      if (totalAmount === 0 && dto.totalAmount) {
        totalAmount = dto.totalAmount;
      }

      const discount = dto.discount ?? 0;
      const discountPct = dto.discountPercentage ?? 0;
      const additionalDiscount = discountPct > 0 ? totalAmount * discountPct / 100 : discount;
      const taxAmount = dto.taxAmount ?? totalTaxAmount;
      const netTotal = totalAmount - additionalDiscount;
      const grandTotal = netTotal + taxAmount;
      const writeOff = dto.writeOffAmount ?? 0;
      const roundingAdj = Math.round(grandTotal - writeOff) - (grandTotal - writeOff);
      const roundedTotal = grandTotal - writeOff + roundingAdj;
      const netAmount = roundedTotal;
      const outstandingAmount = netAmount;

      return tx.salesInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          namingSeries: dto.namingSeries,
          date: new Date(dto.date),
          postingTime: dto.postingTime,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          isReturn: dto.isReturn ?? false,
          returnAgainst: dto.returnAgainst,
          salesOrderId: dto.salesOrderId,
          deliveryChallanId: dto.deliveryChallanId,
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerAddress: dto.customerAddress,
          contactPerson: dto.contactPerson,
          contactEmail: dto.contactEmail,
          contactMobile: dto.contactMobile,
          shippingAddress: dto.shippingAddress,
          currency: dto.currency ?? 'PKR',
          exchangeRate,
          priceListId: dto.priceListId,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          totalQty,
          totalAmount,
          netTotal,
          discountPercentage: discountPct,
          discount: additionalDiscount,
          applyDiscountOn: dto.applyDiscountOn,
          taxTemplateId: dto.taxTemplateId,
          taxesAndCharges: dto.taxesAndCharges ?? [],
          taxAmount,
          grandTotal,
          roundingAdjustment: roundingAdj,
          roundedTotal,
          netAmount,
          outstandingAmount,
          paidAmount: 0,
          writeOffAmount: writeOff,
          writeOffAccountId: dto.writeOffAccountId,
          debitToId: dto.debitToId,
          paymentTerms: dto.paymentTerms,
          paymentTermsDays: dto.paymentTermsDays,
          salespersonId: dto.salespersonId,
          commissionRate: dto.commissionRate ?? 0,
          totalCommission: dto.commissionRate ? (netAmount * dto.commissionRate / 100) : 0,
          letterHead: dto.letterHead,
          termsAndConditions: dto.termsAndConditions,
          remarks: dto.remarks,
          isOpeningEntry: dto.isOpeningEntry ?? false,
          createdBy: userId,
          items: itemsData.length > 0 ? { create: itemsData } : undefined,
        },
        include: { customer: true, salesOrder: true, items: true },
      });
    });
  }

  async postInvoiceToAccounts(
    organizationId: string,
    userId: string,
    invoiceId: string,
    fiscalYearId: string,
  ) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id: invoiceId, organizationId },
      include: { customer: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.journalEntryId)
      throw new BadRequestException('Invoice already posted');

    return this.prisma.$transaction(async (tx) => {
      const receivableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '1130' },
      });
      const salesRevenueAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '4100' },
      });

      if (!receivableAccount || !salesRevenueAccount) {
        throw new NotFoundException('Required accounts not found in COA');
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

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
          lines: {
            create: [
              {
                accountId: receivableAccount.id,
                debit: Number(invoice.netAmount),
                credit: 0,
                narration: `Receivable from ${invoice.customer.name}`,
              },
              {
                accountId: salesRevenueAccount.id,
                debit: 0,
                credit: Number(invoice.netAmount),
                narration: `Sales revenue - ${invoice.invoiceNumber}`,
              },
            ],
          },
        },
      });

      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { journalEntryId: journalEntry.id },
      });

      return { invoice, journalEntry };
    }).then(async (result) => {
      // Post to centralized GL (enterprise accounting engine)
      if (this.glService) {
        try {
          const receivableAccount = await this.prisma.chartOfAccount.findFirst({
            where: { organizationId, code: '1130' },
          });
          const salesRevenueAccount = await this.prisma.chartOfAccount.findFirst({
            where: { organizationId, code: '4100' },
          });
          const gstAccount = await this.prisma.chartOfAccount.findFirst({
            where: { organizationId, code: '2130' },
          });

          if (receivableAccount && salesRevenueAccount) {
            const entries = [
              {
                accountId: receivableAccount.id,
                debit: Number(invoice.netAmount),
                credit: 0,
                partyType: 'CUSTOMER',
                partyId: invoice.customerId,
                partyName: invoice.customer.name,
                remarks: `Receivable - ${invoice.invoiceNumber}`,
              },
              {
                accountId: salesRevenueAccount.id,
                debit: 0,
                credit: Number(invoice.totalAmount) - Number(invoice.discount),
                remarks: `Sales revenue - ${invoice.invoiceNumber}`,
              },
            ];

            // Add GST entry if tax exists
            if (Number(invoice.taxAmount) > 0 && gstAccount) {
              entries.push({
                accountId: gstAccount.id,
                debit: 0,
                credit: Number(invoice.taxAmount),
                remarks: `GST on ${invoice.invoiceNumber}`,
              } as any);
            }

            await this.glService.postToLedger(organizationId, userId, {
              voucherType: 'Sales Invoice',
              voucherNo: invoice.invoiceNumber,
              voucherId: invoice.id,
              postingDate: new Date(invoice.date).toISOString().split('T')[0],
              journalEntryId: result.journalEntry.id,
              remarks: `Sales invoice ${invoice.invoiceNumber} - ${invoice.customer.name}`,
              entries,
            });
          }
        } catch (glError) {
          // GL posting is supplementary — don't fail the main operation
          console.warn('GL posting for sales invoice failed:', glError);
        }
      }
      return result;
    });
  }

  async listSalesInvoices(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    customerId?: string,
  ) {
    const where: Prisma.SalesInvoiceWhereInput = {
      organizationId,
      ...(customerId ? { customerId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.salesInvoice.findMany({
        where,
        include: { customer: true, salesOrder: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.salesInvoice.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== DELIVERY CHALLANS =====

  async createDeliveryChallan(
    organizationId: string,
    userId: string,
    dto: CreateDeliveryChallanDto,
  ) {
    await this.getCustomer(organizationId, dto.customerId);

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.deliveryChallan.count({
        where: { organizationId },
      });
      const challanNumber = `DC-${String(count + 1).padStart(6, '0')}`;

      return tx.deliveryChallan.create({
        data: {
          organizationId,
          challanNumber,
          namingSeries: dto.namingSeries,
          date: new Date(dto.date),
          salesOrderId: dto.salesOrderId,
          salesInvoiceId: dto.salesInvoiceId,
          customerId: dto.customerId,
          customerName: dto.customerName,
          customerAddress: dto.customerAddress,
          shippingAddress: dto.shippingAddress,
          contactPerson: dto.contactPerson,
          contactEmail: dto.contactEmail,
          vehicleId: dto.vehicleId,
          vehicleNumber: dto.vehicleNumber,
          driverName: dto.driverName,
          driverPhone: dto.driverPhone,
          transporterName: dto.transporterName,
          lrNo: dto.lrNo,
          lrDate: dto.lrDate ? new Date(dto.lrDate) : null,
          dispatchFromWarehouseId: dto.dispatchFromWarehouseId,
          costCenterId: dto.costCenterId,
          projectId: dto.projectId,
          receiverName: dto.receiverName,
          receiverPhone: dto.receiverPhone,
          termsAndConditions: dto.termsAndConditions,
          notes: dto.notes,
          remarks: dto.remarks,
          createdBy: userId,
        },
        include: { customer: true, vehicle: true, warehouse: true },
      });
    });
  }

  async markChallanDelivered(
    organizationId: string,
    id: string,
    receiverName?: string,
  ) {
    const challan = await this.prisma.deliveryChallan.findFirst({
      where: { id, organizationId },
    });
    if (!challan) throw new NotFoundException('Delivery challan not found');

    return this.prisma.deliveryChallan.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        receiverName: receiverName ?? challan.receiverName,
      },
      include: { customer: true },
    });
  }

  async listDeliveryChallans(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.deliveryChallan.findMany({
        where: { organizationId },
        include: { customer: true, vehicle: true, salesOrder: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.deliveryChallan.count({ where: { organizationId } }),
    ]);

    return { data, total, page, limit };
  }

  // ===== SALES SUMMARY =====

  async getSalesSummary(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        organizationId,
        deletedAt: null,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
        status: { not: 'CANCELLED' },
      },
      include: { items: { include: { riceVariety: true } }, customer: true },
    });

    const totalOrders = orders.length;
    let totalAmount = 0;
    const byCustomer: Record<
      string,
      { name: string; orders: number; amount: number }
    > = {};
    const byProduct: Record<
      string,
      { name: string; quantity: number; amount: number }
    > = {};

    for (const order of orders) {
      const amount = Number(order.netAmount);
      totalAmount += amount;

      if (!byCustomer[order.customerId]) {
        byCustomer[order.customerId] = {
          name: order.customer.name,
          orders: 0,
          amount: 0,
        };
      }
      byCustomer[order.customerId].orders++;
      byCustomer[order.customerId].amount += amount;

      for (const item of order.items) {
        if (!byProduct[item.riceVarietyId]) {
          byProduct[item.riceVarietyId] = {
            name: item.riceVariety.name,
            quantity: 0,
            amount: 0,
          };
        }
        byProduct[item.riceVarietyId].quantity += Number(item.quantity);
        byProduct[item.riceVarietyId].amount += Number(item.amount);
      }
    }

    return {
      period: { fromDate, toDate },
      totalOrders,
      totalAmount,
      byCustomer: Object.values(byCustomer),
      byProduct: Object.values(byProduct),
    };
  }

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.salesOrder.count({ where: { organizationId } });
    return `SO-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateInvoiceNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const count = await tx.salesInvoice.count({ where: { organizationId } });
    return `INV-${String(count + 1).padStart(6, '0')}`;
  }
}
