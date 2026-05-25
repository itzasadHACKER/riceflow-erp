import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateMarketRateDto } from './dto/market.dto';

@Injectable()
export class MarketIntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  async createRate(organizationId: string, dto: CreateMarketRateDto) {
    return this.prisma.marketRate.create({
      data: {
        organizationId,
        commodityType: dto.commodityType,
        commodityName: dto.commodityName,
        market: dto.market,
        region: dto.region,
        minRate: new Prisma.Decimal(dto.minRate),
        maxRate: new Prisma.Decimal(dto.maxRate),
        avgRate: new Prisma.Decimal(dto.avgRate),
        unit: dto.unit ?? 'PER_MAUND',
        date: new Date(dto.date),
        source: dto.source,
        notes: dto.notes,
      },
    });
  }

  async getRates(organizationId: string, commodityType?: string, market?: string, startDate?: string, endDate?: string) {
    const where: Prisma.MarketRateWhereInput = { organizationId };
    if (commodityType) where.commodityType = commodityType;
    if (market) where.market = market;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    return this.prisma.marketRate.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 200,
    });
  }

  async getLatestRates(organizationId: string, commodityType?: string) {
    const where: Prisma.MarketRateWhereInput = { organizationId };
    if (commodityType) where.commodityType = commodityType;

    const rates = await this.prisma.marketRate.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const latestMap = new Map<string, typeof rates[0]>();
    for (const rate of rates) {
      const key = `${rate.commodityName}-${rate.market}`;
      if (!latestMap.has(key)) latestMap.set(key, rate);
    }
    return Array.from(latestMap.values());
  }

  async getPriceTrend(organizationId: string, commodityName: string, market: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const rates = await this.prisma.marketRate.findMany({
      where: { organizationId, commodityName, market, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    if (rates.length < 2) return { trend: 'INSUFFICIENT_DATA', data: rates };

    const firstRate = Number(rates[0].avgRate);
    const lastRate = Number(rates[rates.length - 1].avgRate);
    const change = lastRate - firstRate;
    const changePercent = firstRate !== 0 ? (change / firstRate) * 100 : 0;

    return {
      commodityName,
      market,
      period: `${days} days`,
      dataPoints: rates.length,
      firstRate,
      lastRate,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      trend: change > 0 ? 'RISING' : change < 0 ? 'FALLING' : 'STABLE',
      data: rates,
    };
  }

  async getMarketComparison(organizationId: string, commodityName: string) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const rates = await this.prisma.marketRate.findMany({
      where: { organizationId, commodityName, date: { gte: yesterday } },
      orderBy: { avgRate: 'desc' },
    });

    return {
      commodityName,
      markets: rates.map((r) => ({
        market: r.market,
        region: r.region,
        minRate: Number(r.minRate),
        maxRate: Number(r.maxRate),
        avgRate: Number(r.avgRate),
        date: r.date,
      })),
      bestMarket: rates.length > 0 ? rates[0].market : null,
      worstMarket: rates.length > 0 ? rates[rates.length - 1].market : null,
    };
  }
}
