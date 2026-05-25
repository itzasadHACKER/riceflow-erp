import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RunMrpDto, CreateForecastDto } from './dto/mrp.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MrpService {
  constructor(private readonly prisma: PrismaService) {}

  async runMrp(orgId: string, userId: string, dto: RunMrpDto) {
    const horizon = dto.planningHorizon || 30;
    const count = await this.prisma.mrpRun.count({ where: { organizationId: orgId } });
    const runNumber = `MRP-${String(count + 1).padStart(4, '0')}`;

    const riceVarieties = await this.prisma.riceVariety.findMany({ where: { organizationId: orgId } });

    const recommendations: any[] = [];
    const horizonDate = new Date();
    horizonDate.setDate(horizonDate.getDate() + horizon);

    for (const variety of riceVarieties) {
      const inventoryItems = await this.prisma.inventoryItem.findMany({
        where: { organizationId: orgId, riceVarietyId: variety.id },
      });
      const available = inventoryItems.reduce((sum, i) => sum.add(i.quantity), new Decimal(0));

      const forecasts = await this.prisma.demandForecast.findMany({
        where: { organizationId: orgId, itemCode: variety.name, periodEnd: { lte: horizonDate } },
      });
      const forecastDemand = forecasts.reduce((sum, f) => sum.add(f.forecastQty), new Decimal(0));
      const totalRequired = forecastDemand.greaterThan(0) ? forecastDemand : new Decimal(0);
      const shortage = totalRequired.sub(available);

      if (shortage.greaterThan(0)) {
        const safetyStock = new Decimal(0);
        const recommended = shortage.add(safetyStock);
        recommendations.push({
          itemCode: variety.name, itemName: variety.name,
          orderType: 'PURCHASE', requiredQty: totalRequired, availableQty: available,
          shortageQty: shortage, recommendedQty: recommended,
          recommendedDate: new Date(), leadTimeDays: 7, safetyStock,
        });
      }
    }

    const mrpRun = await this.prisma.mrpRun.create({
      data: {
        organizationId: orgId, runNumber, planningHorizon: horizon,
        itemsProcessed: riceVarieties.length, recommendationsCount: recommendations.length,
        parameters: dto as any, createdById: userId,
        recommendations: { create: recommendations.map((r) => ({ ...r, status: 'PENDING' })) },
      },
      include: { recommendations: true },
    });

    return mrpRun;
  }

  async findAllRuns(orgId: string) {
    return this.prisma.mrpRun.findMany({
      where: { organizationId: orgId },
      include: { recommendations: { take: 5 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRun(orgId: string, id: string) {
    const run = await this.prisma.mrpRun.findFirst({ where: { id, organizationId: orgId }, include: { recommendations: true } });
    if (!run) throw new NotFoundException('MRP run not found');
    return run;
  }

  async getRecommendations(runId: string) {
    return this.prisma.mrpRecommendation.findMany({ where: { mrpRunId: runId }, orderBy: { shortageQty: 'desc' } });
  }

  async createForecast(orgId: string, dto: CreateForecastDto) {
    return this.prisma.demandForecast.create({
      data: { organizationId: orgId, itemCode: dto.itemCode, periodStart: new Date(dto.periodStart), periodEnd: new Date(dto.periodEnd), forecastQty: dto.forecastQty, method: dto.method || 'MANUAL', notes: dto.notes },
    });
  }

  async findForecasts(orgId: string) {
    return this.prisma.demandForecast.findMany({ where: { organizationId: orgId }, orderBy: { periodStart: 'desc' } });
  }

  async getSummary(orgId: string) {
    const [totalRuns, pendingRecommendations, forecasts] = await Promise.all([
      this.prisma.mrpRun.count({ where: { organizationId: orgId } }),
      this.prisma.mrpRecommendation.count({ where: { mrpRun: { organizationId: orgId }, status: 'PENDING' } }),
      this.prisma.demandForecast.count({ where: { organizationId: orgId } }),
    ]);
    return { totalRuns, pendingRecommendations, totalForecasts: forecasts };
  }
}
