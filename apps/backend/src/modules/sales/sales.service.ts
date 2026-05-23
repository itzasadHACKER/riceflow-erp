import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== CUSTOMERS =====

  async createCustomer(organizationId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        organizationId,
        name: dto.name,
        company: dto.company,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        customerType: dto.customerType ?? 'DEALER',
        cnic: dto.cnic,
        ntn: dto.ntn,
        creditLimit: dto.creditLimit ?? 0,
        openingBalance: dto.openingBalance ?? 0,
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
      const itemsData = dto.items.map((item) => {
        const amount = item.quantity * item.rate;
        totalAmount += amount;
        return {
          riceVarietyId: item.riceVarietyId,
          quantity: item.quantity,
          unit: item.unit ?? 'KG',
          rate: item.rate,
          amount,
          lotNumber: item.lotNumber,
          warehouseId: item.warehouseId,
        };
      });

      const discount = dto.discount ?? 0;
      const taxAmount = dto.taxAmount ?? 0;
      const netAmount = totalAmount - discount + taxAmount;

      return tx.salesOrder.create({
        data: {
          organizationId,
          branchId: dto.branchId,
          orderNumber,
          date: new Date(dto.date),
          customerId: dto.customerId,
          totalAmount,
          discount,
          taxAmount,
          netAmount,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          notes: dto.notes,
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
      const netAmount =
        dto.totalAmount - (dto.discount ?? 0) + (dto.taxAmount ?? 0);

      return tx.salesInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          date: new Date(dto.date),
          salesOrderId: dto.salesOrderId,
          customerId: dto.customerId,
          totalAmount: dto.totalAmount,
          discount: dto.discount ?? 0,
          taxAmount: dto.taxAmount ?? 0,
          netAmount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          createdBy: userId,
        },
        include: { customer: true, salesOrder: true },
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
          date: new Date(dto.date),
          salesOrderId: dto.salesOrderId,
          customerId: dto.customerId,
          vehicleId: dto.vehicleId,
          driverName: dto.driverName,
          driverPhone: dto.driverPhone,
          dispatchFromWarehouseId: dto.dispatchFromWarehouseId,
          receiverName: dto.receiverName,
          notes: dto.notes,
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
