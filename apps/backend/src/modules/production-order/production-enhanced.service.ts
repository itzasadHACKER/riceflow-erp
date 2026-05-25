import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductionEnhancedService {
  constructor(private prisma: PrismaService) {}

  // ─── Resource Capacity Planning ─────────────────────────────
  async getResourceCapacity(orgId: string) {
    const machines = await this.prisma.machine.findMany({
      where: { organizationId: orgId, status: 'OPERATIONAL' },
      include: { maintenanceLogs: { take: 1, orderBy: { completedDate: 'desc' } } },
    });

    return machines.map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      status: m.status,
      capacity: Number(m.capacity || 0),
      capacityUnit: m.capacityUnit,
      availableHoursPerDay: 16,
      dailyCapacity: Number(m.capacity || 0) * 16,
      weeklyCapacity: Number(m.capacity || 0) * 16 * 6,
      utilizationPercent: 75,
      lastMaintenance: m.maintenanceLogs[0]?.completedDate || null,
    }));
  }

  // ─── Routing / Operations ──────────────────────────────────
  async createRouting(orgId: string, dto: any) {
    const key = `routing_${dto.productionOrderId || dto.bomId || 'default'}`;
    return this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      create: {
        organizationId: orgId,
        key,
        value: {
          name: dto.name,
          operations: dto.operations.map((op: any, idx: number) => ({
            operationNo: (idx + 1) * 10,
            name: op.name,
            machineId: op.machineId,
            setupTime: op.setupTime || 0,
            runTime: op.runTime || 0,
            laborCost: op.laborCost || 0,
            description: op.description || '',
          })),
        } as unknown as Prisma.InputJsonValue,
        category: 'ROUTING',
      },
      update: {
        value: {
          name: dto.name,
          operations: dto.operations.map((op: any, idx: number) => ({
            operationNo: (idx + 1) * 10,
            name: op.name,
            machineId: op.machineId,
            setupTime: op.setupTime || 0,
            runTime: op.runTime || 0,
            laborCost: op.laborCost || 0,
            description: op.description || '',
          })),
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findRoutings(orgId: string) {
    const settings = await this.prisma.systemSetting.findMany({
      where: { organizationId: orgId, category: 'ROUTING' },
    });
    return settings.map(s => ({ id: s.id, key: s.key, ...(s.value as Record<string, unknown>) }));
  }

  // ─── Production Cost Rollup ────────────────────────────────
  async calculateCostRollup(orgId: string, productionOrderId: string) {
    const order = await this.prisma.productionOrder.findFirst({
      where: { id: productionOrderId, organizationId: orgId },
    });
    if (!order) throw new NotFoundException('Production order not found');

    const bom = await this.prisma.billOfMaterial.findFirst({
      where: { organizationId: orgId },
      include: { items: true },
    });

    let materialCost = 0;
    if (bom) {
      for (const item of bom.items) {
        materialCost += Number(item.quantity);
      }
    }

    const routingSetting = await this.prisma.systemSetting.findFirst({
      where: { organizationId: orgId, key: `routing_${productionOrderId}`, category: 'ROUTING' },
    });

    let laborCost = 0;
    let overheadCost = 0;
    if (routingSetting) {
      const routing = routingSetting.value as { operations: { laborCost: number }[] };
      for (const op of routing.operations) {
        laborCost += op.laborCost || 0;
      }
      overheadCost = laborCost * 0.15;
    }

    const totalCost = materialCost + laborCost + overheadCost;
    const costPerUnit = Number(order.plannedQty) > 0 ? totalCost / Number(order.plannedQty) : 0;

    const key = `cost_rollup_${productionOrderId}`;
    const costRecord = await this.prisma.systemSetting.upsert({
      where: { organizationId_key: { organizationId: orgId, key } },
      create: {
        organizationId: orgId,
        key,
        value: { productionOrderId, materialCost, laborCost, overheadCost, totalCost, costPerUnit, calculatedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
        category: 'COST_ROLLUP',
      },
      update: {
        value: { productionOrderId, materialCost, laborCost, overheadCost, totalCost, costPerUnit, calculatedAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue,
      },
    });

    return { ...costRecord, materialCost, laborCost, overheadCost, totalCost, costPerUnit };
  }

  async getProductionCosts(orgId: string) {
    const settings = await this.prisma.systemSetting.findMany({
      where: { organizationId: orgId, category: 'COST_ROLLUP' },
      orderBy: { createdAt: 'desc' },
    });
    return settings.map(s => ({ id: s.id, ...(s.value as Record<string, unknown>) }));
  }

  // ─── Summary ────────────────────────────────────────────────
  async getProductionEnhancedSummary(orgId: string) {
    const [machines, routings, costs] = await Promise.all([
      this.prisma.machine.count({ where: { organizationId: orgId, status: 'OPERATIONAL' } }),
      this.prisma.systemSetting.count({ where: { organizationId: orgId, category: 'ROUTING' } }),
      this.prisma.systemSetting.count({ where: { organizationId: orgId, category: 'COST_ROLLUP' } }),
    ]);
    return { activeMachines: machines, routings, costCalculations: costs };
  }
}
