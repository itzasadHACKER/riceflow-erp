import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCampaignDto } from './dto/marketing-campaign.dto';

@Injectable()
export class MarketingCampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreateCampaignDto) {
    const count = await this.prisma.marketingCampaign.count({ where: { organizationId: orgId } });
    const campaignCode = `MC-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.marketingCampaign.create({ data: { organizationId: orgId, campaignCode, name: dto.name, description: dto.description, type: dto.type || 'EMAIL', startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, targetAudience: dto.targetAudience, budget: dto.budget ?? 0, expectedRevenue: dto.expectedRevenue ?? 0 } });
  }

  async findAll(orgId: string) {
    return this.prisma.marketingCampaign.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(orgId: string, id: string) {
    const c = await this.prisma.marketingCampaign.findFirst({ where: { id, organizationId: orgId } });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  async update(orgId: string, id: string, data: any) {
    await this.findOne(orgId, id);
    return this.prisma.marketingCampaign.update({ where: { id }, data });
  }

  async updateStatus(orgId: string, id: string, status: string) {
    return this.prisma.marketingCampaign.update({ where: { id }, data: { status } });
  }

  async getRoi(orgId: string, id: string) {
    const c = await this.findOne(orgId, id);
    const spent = Number(c.actualCost);
    const revenue = Number(c.actualRevenue);
    const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
    return { campaignId: id, name: c.name, spent, revenue, roi: Math.round(roi * 100) / 100, leadsGenerated: c.leadsGenerated, conversions: c.conversions, conversionRate: c.leadsGenerated > 0 ? Math.round((c.conversions / c.leadsGenerated) * 10000) / 100 : 0 };
  }

  async getSummary(orgId: string) {
    const [total, active, agg] = await Promise.all([
      this.prisma.marketingCampaign.count({ where: { organizationId: orgId } }),
      this.prisma.marketingCampaign.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      this.prisma.marketingCampaign.aggregate({ where: { organizationId: orgId }, _sum: { budget: true, actualCost: true, actualRevenue: true, leadsGenerated: true, conversions: true } }),
    ]);
    return { totalCampaigns: total, activeCampaigns: active, totalBudget: agg._sum.budget ?? 0, totalSpent: agg._sum.actualCost ?? 0, totalRevenue: agg._sum.actualRevenue ?? 0, totalLeads: agg._sum.leadsGenerated ?? 0, totalConversions: agg._sum.conversions ?? 0 };
  }
}
