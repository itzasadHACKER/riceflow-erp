import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalespersonDto, AssignPartyDto, RecordSaleDto } from './dto/salesperson.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalespersonService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateSalespersonDto) {
    const count = await this.prisma.salesperson.count({ where: { organizationId } });
    const code = `SP-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.salesperson.create({
      data: {
        organizationId,
        code,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        territory: dto.territory,
        joiningDate: new Date(dto.joiningDate),
        commissionRate: dto.commissionRate ?? 0,
        targetMonthly: dto.targetMonthly ?? 0,
        targetYearly: dto.targetYearly ?? 0,
        employeeId: dto.employeeId,
      },
      include: { partyAssignments: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.salesperson.findMany({
      where: { organizationId, deletedAt: null },
      include: { partyAssignments: true, _count: { select: { salesTransactions: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const sp = await this.prisma.salesperson.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { partyAssignments: true, salesTransactions: { orderBy: { date: 'desc' }, take: 50 } },
    });
    if (!sp) throw new NotFoundException('Salesperson not found');
    return sp;
  }

  async assignParty(organizationId: string, salespersonId: string, dto: AssignPartyDto) {
    await this.findOne(organizationId, salespersonId);
    try {
      return await this.prisma.salespersonPartyAssignment.create({
        data: { salespersonId, customerId: dto.customerId },
      });
    } catch {
      throw new ConflictException('Party already assigned to this salesperson');
    }
  }

  async removeParty(organizationId: string, salespersonId: string, customerId: string) {
    await this.findOne(organizationId, salespersonId);
    const assignment = await this.prisma.salespersonPartyAssignment.findFirst({
      where: { salespersonId, customerId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.salespersonPartyAssignment.delete({ where: { id: assignment.id } });
    return { message: 'Party removed' };
  }

  async recordSale(organizationId: string, salespersonId: string, dto: RecordSaleDto) {
    const sp = await this.findOne(organizationId, salespersonId);
    const commission = Number(sp.commissionRate) > 0
      ? (dto.amount * Number(sp.commissionRate)) / 100
      : 0;

    return this.prisma.salespersonSalesTransaction.create({
      data: {
        organizationId,
        salespersonId,
        date: new Date(dto.date),
        invoiceNumber: dto.invoiceNumber,
        customerName: dto.customerName,
        productName: dto.productName,
        riceVarietyId: dto.riceVarietyId,
        quantity: dto.quantity,
        weight: dto.weight,
        amount: dto.amount,
        commission,
      },
    });
  }

  async getSalesReport(organizationId: string, salespersonId: string, period: string) {
    const sp = await this.findOne(organizationId, salespersonId);
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'mtd':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await this.prisma.salespersonSalesTransaction.findMany({
      where: { organizationId, salespersonId, date: { gte: startDate } },
      orderBy: { date: 'desc' },
    });

    const totalAmount = transactions.reduce((s, t) => s + Number(t.amount), 0);
    const totalWeight = transactions.reduce((s, t) => s + Number(t.weight), 0);
    const totalQuantity = transactions.reduce((s, t) => s + Number(t.quantity), 0);
    const totalCommission = transactions.reduce((s, t) => s + Number(t.commission), 0);

    // Group by product
    const byProduct: Record<string, { quantity: number; weight: number; amount: number }> = {};
    for (const t of transactions) {
      const key = t.productName ?? 'Unknown';
      if (!byProduct[key]) byProduct[key] = { quantity: 0, weight: 0, amount: 0 };
      byProduct[key].quantity += Number(t.quantity);
      byProduct[key].weight += Number(t.weight);
      byProduct[key].amount += Number(t.amount);
    }

    return {
      salesperson: { id: sp.id, name: sp.name, code: sp.code },
      period,
      startDate,
      endDate: now,
      summary: { totalAmount, totalWeight, totalQuantity, totalCommission, transactionCount: transactions.length },
      byProduct: Object.entries(byProduct).map(([name, data]) => ({ name, ...data })),
      transactions,
    };
  }

  async getTeamReport(organizationId: string, period: string) {
    const salespersons = await this.prisma.salesperson.findMany({
      where: { organizationId, deletedAt: null },
    });

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'daily': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'mtd': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const results = await Promise.all(
      salespersons.map(async (sp) => {
        const agg = await this.prisma.salespersonSalesTransaction.aggregate({
          where: { salespersonId: sp.id, date: { gte: startDate } },
          _sum: { amount: true, weight: true, quantity: true, commission: true },
          _count: true,
        });
        return {
          id: sp.id,
          name: sp.name,
          code: sp.code,
          territory: sp.territory,
          totalAmount: Number(agg._sum.amount ?? 0),
          totalWeight: Number(agg._sum.weight ?? 0),
          totalQuantity: Number(agg._sum.quantity ?? 0),
          totalCommission: Number(agg._sum.commission ?? 0),
          transactionCount: agg._count,
          targetMonthly: Number(sp.targetMonthly),
          achievement: Number(sp.targetMonthly) > 0
            ? (Number(agg._sum.amount ?? 0) / Number(sp.targetMonthly)) * 100
            : 0,
        };
      }),
    );

    return { period, startDate, endDate: now, salespersons: results };
  }

  async delete(organizationId: string, id: string) {
    const sp = await this.findOne(organizationId, id);
    await this.prisma.salesperson.update({ where: { id: sp.id }, data: { deletedAt: new Date() } });
    return { message: 'Salesperson deleted' };
  }
}
