import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductionAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProductionDashboard(organizationId: string) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const [
      totalBatches, activeBatches, completedThisMonth, completedThisYear,
    ] = await Promise.all([
      this.prisma.productionBatch.count({ where: { organizationId } }),
      this.prisma.productionBatch.count({ where: { organizationId, status: 'IN_PROGRESS' } }),
      this.prisma.productionBatch.count({ where: { organizationId, status: 'COMPLETED', completedAt: { gte: monthStart } } }),
      this.prisma.productionBatch.count({ where: { organizationId, status: 'COMPLETED', completedAt: { gte: yearStart } } }),
    ]);

    const monthlyInput = await this.prisma.productionBatch.aggregate({
      where: { organizationId, status: 'COMPLETED', completedAt: { gte: monthStart } },
      _sum: { inputWeight: true },
    });

    const yearlyInput = await this.prisma.productionBatch.aggregate({
      where: { organizationId, status: 'COMPLETED', completedAt: { gte: yearStart } },
      _sum: { inputWeight: true },
    });

    const monthlyOutput = await this.prisma.productionOutput.aggregate({
      where: { batch: { organizationId, status: 'COMPLETED', completedAt: { gte: monthStart } } },
      _sum: { outputWeight: true },
    });

    const yearlyOutput = await this.prisma.productionOutput.aggregate({
      where: { batch: { organizationId, status: 'COMPLETED', completedAt: { gte: yearStart } } },
      _sum: { outputWeight: true },
    });

    const monthInput = new Prisma.Decimal(monthlyInput._sum.inputWeight?.toString() || '0');
    const monthOutput = new Prisma.Decimal(monthlyOutput._sum.outputWeight?.toString() || '0');
    const yearInput = new Prisma.Decimal(yearlyInput._sum.inputWeight?.toString() || '0');
    const yearOutput = new Prisma.Decimal(yearlyOutput._sum.outputWeight?.toString() || '0');

    const monthlyRecovery = monthInput.greaterThan(0)
      ? monthOutput.div(monthInput).mul(100).toFixed(2)
      : '0.00';

    const yearlyRecovery = yearInput.greaterThan(0)
      ? yearOutput.div(yearInput).mul(100).toFixed(2)
      : '0.00';

    const monthlyWaste = monthInput.sub(monthOutput);
    const yearlyWaste = yearInput.sub(yearOutput);

    return {
      totalBatches,
      activeBatches,
      completedThisMonth,
      completedThisYear,
      monthly: {
        inputWeight: monthInput.toString(),
        outputWeight: monthOutput.toString(),
        wasteWeight: monthlyWaste.toString(),
        recoveryPercentage: monthlyRecovery,
        wastePercentage: monthInput.greaterThan(0) ? monthlyWaste.div(monthInput).mul(100).toFixed(2) : '0.00',
      },
      yearly: {
        inputWeight: yearInput.toString(),
        outputWeight: yearOutput.toString(),
        wasteWeight: yearlyWaste.toString(),
        recoveryPercentage: yearlyRecovery,
        wastePercentage: yearInput.greaterThan(0) ? yearlyWaste.div(yearInput).mul(100).toFixed(2) : '0.00',
      },
    };
  }

  async getRecoveryAnalysis(organizationId: string, fromDate?: string, toDate?: string) {
    const dateFilter: Prisma.ProductionBatchWhereInput = {};
    if (fromDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), gte: new Date(fromDate) };
    if (toDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), lte: new Date(toDate) };

    const batches = await this.prisma.productionBatch.findMany({
      where: { organizationId, status: 'COMPLETED', ...dateFilter },
      include: {
        inputVariety: true,
        outputs: { include: { outputVariety: true } },
        costs: true,
      },
      orderBy: { date: 'desc' },
    });

    return batches.map(batch => {
      const totalOutput = batch.outputs.reduce(
        (sum, o) => sum.add(new Prisma.Decimal(o.outputWeight.toString())),
        new Prisma.Decimal(0),
      );
      const totalCost = batch.costs.reduce(
        (sum, c) => sum.add(new Prisma.Decimal(c.amount.toString())),
        new Prisma.Decimal(0),
      );
      const inputWeight = new Prisma.Decimal(batch.inputWeight.toString());
      const wasteWeight = inputWeight.sub(totalOutput);
      const recoveryPct = inputWeight.greaterThan(0) ? totalOutput.div(inputWeight).mul(100) : new Prisma.Decimal(0);
      const costPerKgInput = inputWeight.greaterThan(0) ? totalCost.div(inputWeight) : new Prisma.Decimal(0);
      const costPerKgOutput = totalOutput.greaterThan(0) ? totalCost.div(totalOutput) : new Prisma.Decimal(0);

      return {
        batchNumber: batch.batchNumber,
        date: batch.date,
        inputVariety: batch.inputVariety.name,
        inputWeight: inputWeight.toString(),
        totalOutput: totalOutput.toString(),
        wasteWeight: wasteWeight.toString(),
        recoveryPercentage: recoveryPct.toFixed(2),
        wastePercentage: inputWeight.greaterThan(0) ? wasteWeight.div(inputWeight).mul(100).toFixed(2) : '0.00',
        totalCost: totalCost.toString(),
        costPerKgInput: costPerKgInput.toFixed(4),
        costPerKgOutput: costPerKgOutput.toFixed(4),
        outputs: batch.outputs.map(o => ({
          variety: o.outputVariety.name,
          weight: o.outputWeight.toString(),
          recovery: o.recoveryPercentage?.toString() || recoveryPct.toFixed(2),
          grade: o.grade,
        })),
        isRecoveryBelow50: recoveryPct.lessThan(50),
        isRecoveryBelow60: recoveryPct.lessThan(60),
      };
    });
  }

  async getCostAnalysis(organizationId: string, fromDate?: string, toDate?: string) {
    const dateFilter: Prisma.ProductionBatchWhereInput = {};
    if (fromDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), gte: new Date(fromDate) };
    if (toDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), lte: new Date(toDate) };

    const costs = await this.prisma.productionCost.findMany({
      where: { batch: { organizationId, ...dateFilter } },
      include: { batch: true },
    });

    const costByType = new Map<string, Prisma.Decimal>();
    let totalCost = new Prisma.Decimal(0);

    for (const cost of costs) {
      const amount = new Prisma.Decimal(cost.amount.toString());
      totalCost = totalCost.add(amount);
      const existing = costByType.get(cost.costType) || new Prisma.Decimal(0);
      costByType.set(cost.costType, existing.add(amount));
    }

    const breakdown = Array.from(costByType.entries()).map(([type, amount]) => ({
      costType: type,
      totalAmount: amount.toString(),
      percentage: totalCost.greaterThan(0) ? amount.div(totalCost).mul(100).toFixed(2) : '0.00',
    })).sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));

    return { totalCost: totalCost.toString(), breakdown, period: { fromDate, toDate } };
  }

  async getVarietyWiseProduction(organizationId: string) {
    const outputs = await this.prisma.productionOutput.findMany({
      where: { batch: { organizationId, status: 'COMPLETED' } },
      include: { outputVariety: true },
    });

    const byVariety = new Map<string, { name: string; totalWeight: Prisma.Decimal; count: number }>();
    for (const o of outputs) {
      const key = o.outputVarietyId;
      const existing = byVariety.get(key) || { name: o.outputVariety.name, totalWeight: new Prisma.Decimal(0), count: 0 };
      existing.totalWeight = existing.totalWeight.add(new Prisma.Decimal(o.outputWeight.toString()));
      existing.count++;
      byVariety.set(key, existing);
    }

    return Array.from(byVariety.entries()).map(([id, data]) => ({
      varietyId: id,
      varietyName: data.name,
      totalWeight: data.totalWeight.toString(),
      batchCount: data.count,
    })).sort((a, b) => parseFloat(b.totalWeight) - parseFloat(a.totalWeight));
  }

  async getCapacityUtilization(organizationId: string, fromDate?: string, toDate?: string) {
    const dateFilter: Prisma.ProductionBatchWhereInput = {};
    if (fromDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), gte: new Date(fromDate) };
    if (toDate) dateFilter.date = { ...(dateFilter.date as Prisma.DateTimeFilter || {}), lte: new Date(toDate) };

    const machines = await this.prisma.machine.findMany({
      where: { organizationId },
    });

    const batches = await this.prisma.productionBatch.findMany({
      where: { organizationId, status: 'COMPLETED', ...dateFilter },
    });

    const totalCapacityPerDay = machines.reduce(
      (sum, m) => sum.add(new Prisma.Decimal(m.capacity?.toString() || '0')),
      new Prisma.Decimal(0),
    );

    const totalProcessed = batches.reduce(
      (sum, b) => sum.add(new Prisma.Decimal(b.inputWeight.toString())),
      new Prisma.Decimal(0),
    );

    const daysInRange = fromDate && toDate
      ? Math.max(1, Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000))
      : 30;

    const totalCapacity = totalCapacityPerDay.mul(daysInRange);
    const utilization = totalCapacity.greaterThan(0)
      ? totalProcessed.div(totalCapacity).mul(100).toFixed(2)
      : '0.00';

    return {
      machineCount: machines.length,
      dailyCapacity: totalCapacityPerDay.toString(),
      totalCapacity: totalCapacity.toString(),
      totalProcessed: totalProcessed.toString(),
      utilizationPercentage: utilization,
      daysInRange,
      batchCount: batches.length,
    };
  }
}
