import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== DASHBOARD KPIs =====

  async getDashboardKPIs(organizationId: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const [
      totalEmployees,
      totalSuppliers,
      totalCustomers,
      totalWarehouses,
      monthlyPurchases,
      monthlySales,
      pendingOrders,
      pendingLeads,
      totalInventoryItems,
      recentJournalEntries,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.supplier.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.customer.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.warehouse.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.paddyPurchase.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salesOrder.aggregate({
        where: {
          organizationId,
          deletedAt: null,
          date: { gte: startOfMonth, lte: endOfMonth },
          status: { not: 'CANCELLED' },
        },
        _sum: { netAmount: true },
        _count: true,
      }),
      this.prisma.salesOrder.count({
        where: {
          organizationId,
          deletedAt: null,
          status: { in: ['DRAFT', 'CONFIRMED', 'PROCESSING'] },
        },
      }),
      this.prisma.lead.count({
        where: {
          organizationId,
          status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
        },
      }),
      this.prisma.inventoryItem.aggregate({
        where: { organizationId },
        _sum: { quantity: true, totalValue: true },
      }),
      this.prisma.journalEntry.count({
        where: { organizationId, isPosted: true },
      }),
    ]);

    return {
      overview: {
        totalEmployees,
        totalSuppliers,
        totalCustomers,
        totalWarehouses,
        totalPostedEntries: recentJournalEntries,
      },
      monthlyProcurement: {
        totalPurchases: monthlyPurchases._count,
        totalAmount: monthlyPurchases._sum.netAmount ?? 0,
      },
      monthlySales: {
        totalOrders: monthlySales._count,
        totalAmount: monthlySales._sum.netAmount ?? 0,
      },
      pendingOrders,
      pendingLeads,
      inventory: {
        totalQuantity: totalInventoryItems._sum.quantity ?? 0,
        totalValue: totalInventoryItems._sum.totalValue ?? 0,
      },
    };
  }

  // ===== FINANCIAL REPORTS =====

  async getProfitAndLossReport(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const revenueAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'REVENUE', isGroup: false },
    });
    const expenseAccounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'EXPENSE', isGroup: false },
    });

    const revenueData = await this.getAccountBalances(
      organizationId,
      revenueAccounts.map((a) => a.id),
      fromDate,
      toDate,
    );
    const expenseData = await this.getAccountBalances(
      organizationId,
      expenseAccounts.map((a) => a.id),
      fromDate,
      toDate,
    );

    const totalRevenue = revenueData.reduce((s, a) => s + a.balance, 0);
    const totalExpenses = expenseData.reduce((s, a) => s + a.balance, 0);

    return {
      period: { fromDate, toDate },
      revenue: revenueData,
      totalRevenue,
      expenses: expenseData,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      profitMargin:
        totalRevenue > 0
          ? Math.round(
              ((totalRevenue - totalExpenses) / totalRevenue) * 10000,
            ) / 100
          : 0,
    };
  }

  async getBalanceSheetReport(organizationId: string, asOfDate: string) {
    const assets = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'ASSET', isGroup: false },
    });
    const liabilities = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'LIABILITY', isGroup: false },
    });
    const equity = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, accountType: 'EQUITY', isGroup: false },
    });

    const assetData = await this.getAccountBalancesAsOf(
      organizationId,
      assets.map((a) => a.id),
      asOfDate,
    );
    const liabilityData = await this.getAccountBalancesAsOf(
      organizationId,
      liabilities.map((a) => a.id),
      asOfDate,
    );
    const equityData = await this.getAccountBalancesAsOf(
      organizationId,
      equity.map((a) => a.id),
      asOfDate,
    );

    const totalAssets = assetData.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilityData.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equityData.reduce((s, a) => s + a.balance, 0);

    return {
      asOfDate,
      assets: assetData,
      totalAssets,
      liabilities: liabilityData,
      totalLiabilities,
      equity: equityData,
      totalEquity,
      liabilitiesPlusEquity: totalLiabilities + totalEquity,
      isBalanced:
        Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async getTrialBalanceReport(organizationId: string, asOfDate?: string) {
    const accounts = await this.prisma.chartOfAccount.findMany({
      where: { organizationId, isGroup: false },
      orderBy: { code: 'asc' },
    });

    const dateFilter = asOfDate ? { lte: new Date(asOfDate) } : undefined;

    const result: Array<{
      code: string;
      name: string;
      accountType: string;
      debit: number;
      credit: number;
    }> = [];

    let totalDebit = 0;
    let totalCredit = 0;

    for (const account of accounts) {
      const lines = await this.prisma.journalEntryLine.aggregate({
        where: {
          accountId: account.id,
          journalEntry: {
            organizationId,
            isPosted: true,
            ...(dateFilter ? { date: dateFilter } : {}),
          },
        },
        _sum: { debit: true, credit: true },
      });

      const debit = Number(lines._sum.debit ?? 0);
      const credit = Number(lines._sum.credit ?? 0);

      if (debit > 0 || credit > 0) {
        const netDebit = account.balanceType === 'DEBIT' ? debit - credit : 0;
        const netCredit = account.balanceType === 'CREDIT' ? credit - debit : 0;

        result.push({
          code: account.code,
          name: account.name,
          accountType: account.accountType,
          debit: netDebit > 0 ? netDebit : 0,
          credit: netCredit > 0 ? netCredit : 0,
        });

        totalDebit += netDebit > 0 ? netDebit : 0;
        totalCredit += netCredit > 0 ? netCredit : 0;
      }
    }

    return {
      asOfDate: asOfDate ?? 'current',
      accounts: result,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }

  // ===== PROCUREMENT REPORTS =====

  async getProcurementReport(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const purchases = await this.prisma.paddyPurchase.findMany({
      where: {
        organizationId,
        deletedAt: null,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: { supplier: true, riceVariety: true, branch: true },
      orderBy: { date: 'desc' },
    });

    let totalWeight = 0;
    let totalAmount = 0;
    const dailyTotals: Record<
      string,
      { date: string; weight: number; amount: number; count: number }
    > = {};
    const bySupplier: Record<
      string,
      { name: string; weight: number; amount: number; count: number }
    > = {};
    const byVariety: Record<
      string,
      {
        name: string;
        weight: number;
        amount: number;
        avgRate: number;
        count: number;
      }
    > = {};
    const byBranch: Record<
      string,
      { name: string; weight: number; amount: number; count: number }
    > = {};

    for (const p of purchases) {
      const weight = Number(p.finalWeight);
      const amount = Number(p.netAmount);
      totalWeight += weight;
      totalAmount += amount;

      const dateKey = p.date.toISOString().split('T')[0];
      if (!dailyTotals[dateKey])
        dailyTotals[dateKey] = {
          date: dateKey,
          weight: 0,
          amount: 0,
          count: 0,
        };
      dailyTotals[dateKey].weight += weight;
      dailyTotals[dateKey].amount += amount;
      dailyTotals[dateKey].count++;

      if (!bySupplier[p.supplierId])
        bySupplier[p.supplierId] = {
          name: p.supplier.name,
          weight: 0,
          amount: 0,
          count: 0,
        };
      bySupplier[p.supplierId].weight += weight;
      bySupplier[p.supplierId].amount += amount;
      bySupplier[p.supplierId].count++;

      if (!byVariety[p.riceVarietyId])
        byVariety[p.riceVarietyId] = {
          name: p.riceVariety.name,
          weight: 0,
          amount: 0,
          avgRate: 0,
          count: 0,
        };
      byVariety[p.riceVarietyId].weight += weight;
      byVariety[p.riceVarietyId].amount += amount;
      byVariety[p.riceVarietyId].count++;

      const branchName = p.branch?.name ?? 'Unknown';
      if (!byBranch[p.branchId])
        byBranch[p.branchId] = {
          name: branchName,
          weight: 0,
          amount: 0,
          count: 0,
        };
      byBranch[p.branchId].weight += weight;
      byBranch[p.branchId].amount += amount;
      byBranch[p.branchId].count++;
    }

    for (const key of Object.keys(byVariety)) {
      byVariety[key].avgRate =
        byVariety[key].weight > 0
          ? byVariety[key].amount / byVariety[key].weight
          : 0;
    }

    return {
      period: { fromDate, toDate },
      summary: {
        totalPurchases: purchases.length,
        totalWeight,
        totalAmount,
        averageRate: totalWeight > 0 ? totalAmount / totalWeight : 0,
      },
      dailyTotals: Object.values(dailyTotals).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      bySupplier: Object.values(bySupplier).sort((a, b) => b.amount - a.amount),
      byVariety: Object.values(byVariety).sort((a, b) => b.amount - a.amount),
      byBranch: Object.values(byBranch),
    };
  }

  // ===== SALES REPORTS =====

  async getSalesReport(
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
      include: {
        customer: true,
        items: { include: { riceVariety: true } },
        branch: true,
      },
      orderBy: { date: 'desc' },
    });

    let totalAmount = 0;
    const dailyTotals: Record<
      string,
      { date: string; amount: number; count: number }
    > = {};
    const byCustomer: Record<
      string,
      { name: string; amount: number; count: number }
    > = {};
    const byProduct: Record<
      string,
      { name: string; quantity: number; amount: number }
    > = {};
    const statusBreakdown: Record<string, number> = {};

    for (const order of orders) {
      const amount = Number(order.netAmount);
      totalAmount += amount;

      const dateKey = order.date.toISOString().split('T')[0];
      if (!dailyTotals[dateKey])
        dailyTotals[dateKey] = { date: dateKey, amount: 0, count: 0 };
      dailyTotals[dateKey].amount += amount;
      dailyTotals[dateKey].count++;

      if (!byCustomer[order.customerId])
        byCustomer[order.customerId] = {
          name: order.customer.name,
          amount: 0,
          count: 0,
        };
      byCustomer[order.customerId].amount += amount;
      byCustomer[order.customerId].count++;

      statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;

      for (const item of order.items) {
        if (!byProduct[item.riceVarietyId])
          byProduct[item.riceVarietyId] = {
            name: item.riceVariety.name,
            quantity: 0,
            amount: 0,
          };
        byProduct[item.riceVarietyId].quantity += Number(item.quantity);
        byProduct[item.riceVarietyId].amount += Number(item.amount);
      }
    }

    return {
      period: { fromDate, toDate },
      summary: {
        totalOrders: orders.length,
        totalAmount,
        averageOrderValue: orders.length > 0 ? totalAmount / orders.length : 0,
      },
      dailyTotals: Object.values(dailyTotals).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      byCustomer: Object.values(byCustomer).sort((a, b) => b.amount - a.amount),
      byProduct: Object.values(byProduct).sort((a, b) => b.amount - a.amount),
      statusBreakdown,
    };
  }

  // ===== INVENTORY REPORTS =====

  async getInventoryReport(organizationId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { organizationId },
      include: { warehouse: true, riceVariety: true },
    });

    const byWarehouse: Record<
      string,
      {
        name: string;
        items: Array<{
          variety: string;
          quantity: number;
          unit: string;
          value: number;
          bagCount: number | null;
        }>;
        totalQuantity: number;
        totalValue: number;
      }
    > = {};

    const byVariety: Record<
      string,
      {
        name: string;
        warehouses: Array<{
          warehouse: string;
          quantity: number;
          value: number;
        }>;
        totalQuantity: number;
        totalValue: number;
      }
    > = {};

    for (const item of items) {
      const qty = Number(item.quantity);
      const value = Number(item.totalValue);

      if (!byWarehouse[item.warehouseId]) {
        byWarehouse[item.warehouseId] = {
          name: item.warehouse.name,
          items: [],
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      byWarehouse[item.warehouseId].items.push({
        variety: item.riceVariety.name,
        quantity: qty,
        unit: item.unit,
        value,
        bagCount: item.bagCount,
      });
      byWarehouse[item.warehouseId].totalQuantity += qty;
      byWarehouse[item.warehouseId].totalValue += value;

      if (!byVariety[item.riceVarietyId]) {
        byVariety[item.riceVarietyId] = {
          name: item.riceVariety.name,
          warehouses: [],
          totalQuantity: 0,
          totalValue: 0,
        };
      }
      byVariety[item.riceVarietyId].warehouses.push({
        warehouse: item.warehouse.name,
        quantity: qty,
        value,
      });
      byVariety[item.riceVarietyId].totalQuantity += qty;
      byVariety[item.riceVarietyId].totalValue += value;
    }

    const grandTotal = items.reduce((s, i) => s + Number(i.totalValue), 0);
    const grandQuantity = items.reduce((s, i) => s + Number(i.quantity), 0);

    return {
      grandTotalQuantity: grandQuantity,
      grandTotalValue: grandTotal,
      totalItems: items.length,
      byWarehouse: Object.values(byWarehouse),
      byVariety: Object.values(byVariety),
    };
  }

  async getStockMovementReport(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        organizationId,
        movementDate: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: { sourceWarehouse: true, destinationWarehouse: true },
      orderBy: { movementDate: 'desc' },
    });

    const byType: Record<string, { count: number; totalQuantity: number }> = {};

    for (const m of movements) {
      if (!byType[m.movementType])
        byType[m.movementType] = { count: 0, totalQuantity: 0 };
      byType[m.movementType].count++;
      byType[m.movementType].totalQuantity += Number(m.quantity);
    }

    return {
      period: { fromDate, toDate },
      totalMovements: movements.length,
      byType,
      movements: movements.slice(0, 100),
    };
  }

  // ===== PRODUCTION REPORTS =====

  async getProductionReport(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const batches = await this.prisma.productionBatch.findMany({
      where: {
        organizationId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: {
        inputVariety: true,
        outputs: { include: { outputVariety: true } },
        costs: true,
        millingRecords: true,
        branch: true,
      },
    });

    let totalInput = 0;
    let totalOutput = 0;
    let totalCost = 0;
    const byProcess: Record<
      string,
      { count: number; input: number; output: number; recovery: number }
    > = {};
    const statusBreakdown: Record<string, number> = {};

    for (const batch of batches) {
      const input = Number(batch.inputWeight);
      const output = batch.outputs.reduce(
        (s, o) => s + Number(o.outputWeight),
        0,
      );
      const cost = batch.costs.reduce((s, c) => s + Number(c.amount), 0);

      totalInput += input;
      totalOutput += output;
      totalCost += cost;

      if (!byProcess[batch.processType])
        byProcess[batch.processType] = {
          count: 0,
          input: 0,
          output: 0,
          recovery: 0,
        };
      byProcess[batch.processType].count++;
      byProcess[batch.processType].input += input;
      byProcess[batch.processType].output += output;

      statusBreakdown[batch.status] = (statusBreakdown[batch.status] ?? 0) + 1;
    }

    for (const key of Object.keys(byProcess)) {
      byProcess[key].recovery =
        byProcess[key].input > 0
          ? Math.round((byProcess[key].output / byProcess[key].input) * 10000) /
            100
          : 0;
    }

    return {
      period: { fromDate, toDate },
      summary: {
        totalBatches: batches.length,
        totalInput,
        totalOutput,
        overallRecovery:
          totalInput > 0
            ? Math.round((totalOutput / totalInput) * 10000) / 100
            : 0,
        totalCost,
        costPerUnit:
          totalOutput > 0
            ? Math.round((totalCost / totalOutput) * 100) / 100
            : 0,
      },
      byProcess,
      statusBreakdown,
    };
  }

  // ===== HR REPORTS =====

  async getHrReport(organizationId: string, month: number, year: number) {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      include: { branch: true, department: true },
    });

    const salarySlips = await this.prisma.salarySlip.findMany({
      where: { employee: { organizationId }, month, year },
      include: { employee: true },
    });

    const attendance = await this.prisma.attendanceRecord.findMany({
      where: {
        employee: { organizationId },
        date: {
          gte: new Date(year, month - 1, 1),
          lte: new Date(year, month, 0),
        },
      },
    });

    const attendanceSummary: Record<string, number> = {};
    for (const record of attendance) {
      attendanceSummary[record.status] =
        (attendanceSummary[record.status] ?? 0) + 1;
    }

    const totalSalary = salarySlips.reduce(
      (s, slip) => s + Number(slip.grossSalary),
      0,
    );
    const totalNetSalary = salarySlips.reduce(
      (s, slip) => s + Number(slip.netSalary),
      0,
    );

    return {
      month,
      year,
      totalEmployees: employees.length,
      byDepartment: this.groupByField(
        employees,
        'departmentId',
        (e) => e.department?.name ?? 'Unassigned',
      ),
      byBranch: this.groupByField(
        employees,
        'branchId',
        (e) => e.branch?.name ?? 'Unassigned',
      ),
      payroll: {
        totalSlips: salarySlips.length,
        totalGrossSalary: totalSalary,
        totalNetSalary: totalNetSalary,
        statusBreakdown: this.countByField(salarySlips, 'status'),
      },
      attendance: attendanceSummary,
    };
  }

  // ===== RECEIVABLES & PAYABLES =====

  async getReceivablesReport(organizationId: string) {
    const customers = await this.prisma.customer.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      include: {
        salesInvoices: {
          where: { paymentStatus: { not: 'PAID' } },
          orderBy: { date: 'asc' },
        },
      },
    });

    const receivables = customers
      .filter((c) => c.salesInvoices.length > 0)
      .map((c) => ({
        customerId: c.id,
        name: c.name,
        phone: c.phone,
        invoiceCount: c.salesInvoices.length,
        totalOutstanding: c.salesInvoices.reduce(
          (s, inv) => s + Number(inv.netAmount),
          0,
        ),
        oldestInvoice: c.salesInvoices[0]?.date,
      }));

    const totalReceivable = receivables.reduce(
      (s, r) => s + r.totalOutstanding,
      0,
    );

    return {
      totalReceivable,
      customerCount: receivables.length,
      receivables: receivables.sort(
        (a, b) => b.totalOutstanding - a.totalOutstanding,
      ),
    };
  }

  async getPayablesReport(organizationId: string) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      include: {
        paddyPurchases: {
          where: { paymentStatus: { not: 'PAID' }, deletedAt: null },
          orderBy: { date: 'asc' },
        },
      },
    });

    const payables = suppliers
      .filter((s) => s.paddyPurchases.length > 0)
      .map((s) => ({
        supplierId: s.id,
        name: s.name,
        phone: s.phone,
        purchaseCount: s.paddyPurchases.length,
        totalOutstanding: s.paddyPurchases.reduce(
          (sum, p) => sum + Number(p.netAmount),
          0,
        ),
        oldestPurchase: s.paddyPurchases[0]?.date,
      }));

    const totalPayable = payables.reduce((s, p) => s + p.totalOutstanding, 0);

    return {
      totalPayable,
      supplierCount: payables.length,
      payables: payables.sort(
        (a, b) => b.totalOutstanding - a.totalOutstanding,
      ),
    };
  }

  // ===== TRANSPORT REPORTS =====

  async getTransportReport(
    organizationId: string,
    fromDate: string,
    toDate: string,
  ) {
    const entries = await this.prisma.freightEntry.findMany({
      where: {
        organizationId,
        date: { gte: new Date(fromDate), lte: new Date(toDate) },
      },
      include: { vehicle: true, driver: true },
      orderBy: { date: 'desc' },
    });

    let totalFreight = 0;
    const byVehicle: Record<
      string,
      { vehicleNumber: string; trips: number; totalAmount: number }
    > = {};
    const byRoute: Record<
      string,
      { route: string; trips: number; totalAmount: number; avgFreight: number }
    > = {};

    for (const entry of entries) {
      totalFreight += Number(entry.totalAmount);

      const vKey = entry.vehicleId ?? 'external';
      if (!byVehicle[vKey])
        byVehicle[vKey] = {
          vehicleNumber: entry.vehicle?.vehicleNumber ?? 'External',
          trips: 0,
          totalAmount: 0,
        };
      byVehicle[vKey].trips++;
      byVehicle[vKey].totalAmount += Number(entry.totalAmount);

      const routeKey = `${entry.fromLocation} → ${entry.toLocation}`;
      if (!byRoute[routeKey])
        byRoute[routeKey] = {
          route: routeKey,
          trips: 0,
          totalAmount: 0,
          avgFreight: 0,
        };
      byRoute[routeKey].trips++;
      byRoute[routeKey].totalAmount += Number(entry.totalAmount);
    }

    for (const key of Object.keys(byRoute)) {
      byRoute[key].avgFreight =
        byRoute[key].trips > 0
          ? byRoute[key].totalAmount / byRoute[key].trips
          : 0;
    }

    return {
      period: { fromDate, toDate },
      summary: {
        totalTrips: entries.length,
        totalFreight,
        avgPerTrip: entries.length > 0 ? totalFreight / entries.length : 0,
      },
      byVehicle: Object.values(byVehicle).sort(
        (a, b) => b.totalAmount - a.totalAmount,
      ),
      byRoute: Object.values(byRoute).sort((a, b) => b.trips - a.trips),
    };
  }

  // ===== HELPER METHODS =====

  private async getAccountBalances(
    organizationId: string,
    accountIds: string[],
    fromDate: string,
    toDate: string,
  ) {
    const results: Array<{
      accountId: string;
      code: string;
      name: string;
      balance: number;
    }> = [];

    for (const accountId of accountIds) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: accountId },
      });
      if (!account) continue;

      const lines = await this.prisma.journalEntryLine.aggregate({
        where: {
          accountId,
          journalEntry: {
            organizationId,
            isPosted: true,
            date: { gte: new Date(fromDate), lte: new Date(toDate) },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const debit = Number(lines._sum.debit ?? 0);
      const credit = Number(lines._sum.credit ?? 0);
      const balance =
        account.balanceType === 'DEBIT' ? debit - credit : credit - debit;

      if (balance !== 0) {
        results.push({
          accountId,
          code: account.code,
          name: account.name,
          balance,
        });
      }
    }

    return results;
  }

  private async getAccountBalancesAsOf(
    organizationId: string,
    accountIds: string[],
    asOfDate: string,
  ) {
    const results: Array<{
      accountId: string;
      code: string;
      name: string;
      balance: number;
    }> = [];

    for (const accountId of accountIds) {
      const account = await this.prisma.chartOfAccount.findUnique({
        where: { id: accountId },
      });
      if (!account) continue;

      const lines = await this.prisma.journalEntryLine.aggregate({
        where: {
          accountId,
          journalEntry: {
            organizationId,
            isPosted: true,
            date: { lte: new Date(asOfDate) },
          },
        },
        _sum: { debit: true, credit: true },
      });

      const debit = Number(lines._sum.debit ?? 0);
      const credit = Number(lines._sum.credit ?? 0);
      const balance =
        account.balanceType === 'DEBIT' ? debit - credit : credit - debit;

      if (balance !== 0 || Number(account.openingBalance) !== 0) {
        results.push({
          accountId,
          code: account.code,
          name: account.name,
          balance: balance + Number(account.openingBalance),
        });
      }
    }

    return results;
  }

  private groupByField<T extends Record<string, unknown>>(
    items: T[],
    field: string,
    nameGetter: (item: T) => string,
  ): Array<{ name: string; count: number }> {
    const groups: Record<string, { name: string; count: number }> = {};
    for (const item of items) {
      const fieldValue = item[field];
      const key = fieldValue != null ? `${fieldValue as string}` : 'none';
      if (!groups[key]) groups[key] = { name: nameGetter(item), count: 0 };
      groups[key].count++;
    }
    return Object.values(groups);
  }

  private countByField<T extends Record<string, unknown>>(
    items: T[],
    field: string,
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = String(item[field]);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }
}
