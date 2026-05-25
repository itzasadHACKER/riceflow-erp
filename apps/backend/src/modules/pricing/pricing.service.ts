import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePriceListDto, AddPriceListItemDto, CreateDiscountGroupDto, CreateSpecialPriceDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async createPriceList(orgId: string, dto: CreatePriceListDto) {
    return this.prisma.priceList.create({
      data: { organizationId: orgId, name: dto.name, description: dto.description, currency: dto.currency || 'PKR', isDefault: dto.isDefault ?? false, validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined, validTo: dto.validTo ? new Date(dto.validTo) : undefined, basePriceListId: dto.basePriceListId, factor: dto.factor ?? 1 },
    });
  }

  async findAllPriceLists(orgId: string) {
    return this.prisma.priceList.findMany({ where: { organizationId: orgId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async addPriceListItem(priceListId: string, dto: AddPriceListItemDto) {
    return this.prisma.priceListItem.create({ data: { priceListId, itemCode: dto.itemCode, itemName: dto.itemName, price: dto.price, minimumQty: dto.minimumQty ?? 0 } });
  }

  async createDiscountGroup(orgId: string, dto: CreateDiscountGroupDto) {
    const group = await this.prisma.discountGroup.create({
      data: { organizationId: orgId, name: dto.name, type: dto.type || 'VOLUME' },
    });
    if (dto.tiers?.length) {
      for (const tier of dto.tiers) {
        await this.prisma.discountTier.create({ data: { discountGroupId: group.id, fromQty: tier.fromQty, toQty: tier.toQty, discountPercent: tier.discountPercent } });
      }
    }
    return this.prisma.discountGroup.findUnique({ where: { id: group.id }, include: { tiers: true } });
  }

  async findAllDiscountGroups(orgId: string) {
    return this.prisma.discountGroup.findMany({ where: { organizationId: orgId }, include: { tiers: true }, orderBy: { createdAt: 'desc' } });
  }

  async createSpecialPrice(orgId: string, dto: CreateSpecialPriceDto) {
    return this.prisma.specialPrice.create({
      data: { organizationId: orgId, partnerId: dto.partnerId, partnerType: dto.partnerType || 'CUSTOMER', itemCode: dto.itemCode, price: dto.price, discountPercent: dto.discountPercent, validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined, validTo: dto.validTo ? new Date(dto.validTo) : undefined },
    });
  }

  async findAllSpecialPrices(orgId: string) {
    return this.prisma.specialPrice.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async getItemPrice(orgId: string, itemCode: string, partnerId?: string, qty?: number) {
    let price: number | null = null;
    if (partnerId) {
      const special = await this.prisma.specialPrice.findFirst({ where: { organizationId: orgId, partnerId, itemCode, isActive: true } });
      if (special) price = Number(special.price);
    }
    if (price === null) {
      const defaultList = await this.prisma.priceList.findFirst({ where: { organizationId: orgId, isDefault: true }, include: { items: { where: { itemCode } } } });
      if (defaultList?.items?.[0]) price = Number(defaultList.items[0].price);
    }
    if (price !== null && qty) {
      const discountGroups = await this.prisma.discountGroup.findMany({ where: { organizationId: orgId, isActive: true }, include: { tiers: true } });
      for (const group of discountGroups) {
        const tier = group.tiers.find((t) => Number(t.fromQty) <= qty && (!t.toQty || Number(t.toQty) >= qty));
        if (tier) { price = price * (1 - Number(tier.discountPercent) / 100); break; }
      }
    }
    return { itemCode, price, currency: 'PKR' };
  }

  async getSummary(orgId: string) {
    const [priceLists, discountGroups, specialPrices] = await Promise.all([
      this.prisma.priceList.count({ where: { organizationId: orgId } }),
      this.prisma.discountGroup.count({ where: { organizationId: orgId } }),
      this.prisma.specialPrice.count({ where: { organizationId: orgId } }),
    ]);
    return { priceLists, discountGroups, specialPrices };
  }
}
