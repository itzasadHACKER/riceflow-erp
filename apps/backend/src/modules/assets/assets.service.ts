import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateFixedAssetDto,
  UpdateFixedAssetDto,
  DisposeAssetDto,
  RunDepreciationDto,
  AssetFilterDto,
} from './dto/asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateAssetCode(organizationId: string): Promise<string> {
    const count = await this.prisma.fixedAsset.count({
      where: { organizationId },
    });
    return `AST-${String(count + 1).padStart(6, '0')}`;
  }

  async createAsset(organizationId: string, dto: CreateFixedAssetDto) {
    const assetCode = await this.generateAssetCode(organizationId);
    const purchasePrice = new Prisma.Decimal(dto.purchasePrice);
    const salvageValue = new Prisma.Decimal(dto.salvageValue ?? 0);

    return this.prisma.fixedAsset.create({
      data: {
        organizationId,
        assetCode,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        branchId: dto.branchId,
        purchaseDate: new Date(dto.purchaseDate),
        purchasePrice,
        salvageValue,
        usefulLifeYears: dto.usefulLifeYears,
        depreciationMethod: dto.depreciationMethod ?? 'STRAIGHT_LINE',
        currentValue: purchasePrice,
        assetAccountId: dto.assetAccountId,
        deprExpenseAccountId: dto.deprExpenseAccountId,
        accumDeprAccountId: dto.accumDeprAccountId,
        serialNumber: dto.serialNumber,
        warrantyExpiry: dto.warrantyExpiry
          ? new Date(dto.warrantyExpiry)
          : undefined,
      },
    });
  }

  async getAssets(organizationId: string, filter: AssetFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.FixedAssetWhereInput = {
      organizationId,
      deletedAt: null,
    };
    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.category) {
      where.category = { contains: filter.category, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.fixedAsset.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fixedAsset.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getAssetById(organizationId: string, id: string) {
    const asset = await this.prisma.fixedAsset.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { depreciations: { orderBy: { date: 'desc' } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async updateAsset(
    organizationId: string,
    id: string,
    dto: UpdateFixedAssetDto,
  ) {
    await this.getAssetById(organizationId, id);
    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        location: dto.location,
        salvageValue: dto.salvageValue
          ? new Prisma.Decimal(dto.salvageValue)
          : undefined,
        status: dto.status,
      },
    });
  }

  async disposeAsset(organizationId: string, id: string, dto: DisposeAssetDto) {
    const asset = await this.getAssetById(organizationId, id);
    if (asset.status === 'DISPOSED') {
      throw new BadRequestException('Asset already disposed');
    }
    const disposalAmount = new Prisma.Decimal(dto.disposalAmount);
    return this.prisma.fixedAsset.update({
      where: { id },
      data: {
        status: 'DISPOSED',
        disposalDate: new Date(dto.disposalDate),
        disposalAmount,
      },
    });
  }

  async deleteAsset(organizationId: string, id: string) {
    await this.getAssetById(organizationId, id);
    return this.prisma.fixedAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async runDepreciation(organizationId: string, dto: RunDepreciationDto) {
    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    const results: Array<{
      assetId: string;
      assetCode: string;
      amount: string;
    }> = [];

    for (const asset of assets) {
      const alreadyRun = await this.prisma.assetDepreciation.findFirst({
        where: { assetId: asset.id, period: dto.period },
      });
      if (alreadyRun) continue;

      const depreciableAmount = asset.purchasePrice.sub(asset.salvageValue);
      let monthlyDepr: Prisma.Decimal;

      if (asset.depreciationMethod === 'STRAIGHT_LINE') {
        const totalMonths = asset.usefulLifeYears * 12;
        monthlyDepr = depreciableAmount.div(totalMonths);
      } else if (asset.depreciationMethod === 'DECLINING_BALANCE') {
        const rate = new Prisma.Decimal(1).div(asset.usefulLifeYears);
        const annualDepr = asset.currentValue.mul(rate);
        monthlyDepr = annualDepr.div(12);
      } else if (asset.depreciationMethod === 'DOUBLE_DECLINING') {
        const rate = new Prisma.Decimal(2).div(asset.usefulLifeYears);
        const annualDepr = asset.currentValue.mul(rate);
        monthlyDepr = annualDepr.div(12);
      } else {
        const totalMonths = asset.usefulLifeYears * 12;
        monthlyDepr = depreciableAmount.div(totalMonths);
      }

      const remainingDepreciable = depreciableAmount.sub(asset.accumulatedDepr);
      if (monthlyDepr.greaterThan(remainingDepreciable)) {
        monthlyDepr = remainingDepreciable;
      }
      if (monthlyDepr.lessThanOrEqualTo(0)) continue;

      let journalEntryId: string | undefined;
      if (asset.deprExpenseAccountId && asset.accumDeprAccountId) {
        const entryCount = await this.prisma.journalEntry.count({
          where: { organizationId },
        });
        const entryNumber = `JE-${String(entryCount + 1).padStart(6, '0')}`;
        const entry = await this.prisma.journalEntry.create({
          data: {
            organizationId,
            entryNumber,
            date: new Date(dto.date),
            reference: `Depreciation - ${asset.assetCode} - ${dto.period}`,
            narration: `Monthly depreciation for ${asset.name} (${asset.assetCode}), Period: ${dto.period}`,
            entryType: 'DEPRECIATION',
            fiscalYearId: dto.fiscalYearId,
            isPosted: true,
            postedAt: new Date(),
            lines: {
              create: [
                {
                  accountId: asset.deprExpenseAccountId,
                  debit: monthlyDepr,
                  credit: new Prisma.Decimal(0),
                  narration: `Depreciation expense - ${asset.name}`,
                },
                {
                  accountId: asset.accumDeprAccountId,
                  debit: new Prisma.Decimal(0),
                  credit: monthlyDepr,
                  narration: `Accumulated depreciation - ${asset.name}`,
                },
              ],
            },
          },
        });
        journalEntryId = entry.id;
      }

      const finalAccum = asset.accumulatedDepr.add(monthlyDepr);
      const finalBookValue = asset.purchasePrice.sub(finalAccum);

      await this.prisma.assetDepreciation.create({
        data: {
          organizationId,
          assetId: asset.id,
          period: dto.period,
          date: new Date(dto.date),
          amount: monthlyDepr,
          accumulatedTotal: finalAccum,
          bookValue: finalBookValue.lessThan(asset.salvageValue)
            ? asset.salvageValue
            : finalBookValue,
          journalEntryId,
        },
      });

      await this.prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepr: finalAccum,
          currentValue: finalBookValue.lessThan(asset.salvageValue)
            ? asset.salvageValue
            : finalBookValue,
        },
      });

      results.push({
        assetId: asset.id,
        assetCode: asset.assetCode,
        amount: monthlyDepr.toString(),
      });
    }

    return {
      period: dto.period,
      assetsProcessed: results.length,
      details: results,
    };
  }

  async getDepreciationSchedule(organizationId: string, assetId: string) {
    await this.getAssetById(organizationId, assetId);
    return this.prisma.assetDepreciation.findMany({
      where: { assetId, organizationId },
      orderBy: { date: 'asc' },
    });
  }

  async getAssetSummary(organizationId: string) {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { organizationId, deletedAt: null },
    });
    let totalPurchaseValue = new Prisma.Decimal(0);
    let totalCurrentValue = new Prisma.Decimal(0);
    let totalAccumDepr = new Prisma.Decimal(0);
    const categoryBreakdown: Record<string, { count: number; value: string }> =
      {};

    for (const a of assets) {
      totalPurchaseValue = totalPurchaseValue.add(a.purchasePrice);
      totalCurrentValue = totalCurrentValue.add(a.currentValue);
      totalAccumDepr = totalAccumDepr.add(a.accumulatedDepr);
      if (!categoryBreakdown[a.category]) {
        categoryBreakdown[a.category] = { count: 0, value: '0' };
      }
      categoryBreakdown[a.category].count += 1;
      categoryBreakdown[a.category].value = new Prisma.Decimal(
        categoryBreakdown[a.category].value,
      )
        .add(a.currentValue)
        .toString();
    }

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.status === 'ACTIVE').length,
      disposedAssets: assets.filter((a) => a.status === 'DISPOSED').length,
      totalPurchaseValue: totalPurchaseValue.toString(),
      totalCurrentValue: totalCurrentValue.toString(),
      totalAccumulatedDepreciation: totalAccumDepr.toString(),
      categoryBreakdown,
    };
  }
}
