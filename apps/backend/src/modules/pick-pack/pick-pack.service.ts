import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePickListDto, CreatePackingListDto } from './dto/pick-pack.dto';

@Injectable()
export class PickPackService {
  constructor(private readonly prisma: PrismaService) {}

  async createPickList(orgId: string, dto: CreatePickListDto) {
    const count = await this.prisma.pickList.count({ where: { organizationId: orgId } });
    const pickListNumber = `PK-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.pickList.create({ data: { organizationId: orgId, pickListNumber, salesOrderId: dto.salesOrderId, warehouseId: dto.warehouseId, assignedTo: dto.assignedTo, items: (dto.items || []) as any } });
  }

  async findAllPickLists(orgId: string) {
    return this.prisma.pickList.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async updatePickListStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'COMPLETED') data.completedAt = new Date();
    return this.prisma.pickList.update({ where: { id }, data });
  }

  async createPackingList(orgId: string, dto: CreatePackingListDto) {
    const count = await this.prisma.packingList.count({ where: { organizationId: orgId } });
    const packingNumber = `PCK-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.packingList.create({ data: { organizationId: orgId, packingNumber, pickListId: dto.pickListId, salesOrderId: dto.salesOrderId, shippingMethod: dto.shippingMethod, trackingNumber: dto.trackingNumber, totalWeight: dto.totalWeight ?? 0, totalPackages: dto.totalPackages ?? 0, packages: (dto.packages || []) as any } });
  }

  async findAllPackingLists(orgId: string) {
    return this.prisma.packingList.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async updatePackingStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'SHIPPED') data.completedAt = new Date();
    return this.prisma.packingList.update({ where: { id }, data });
  }

  async getSummary(orgId: string) {
    const [pickLists, openPicks, packingLists, shipping] = await Promise.all([
      this.prisma.pickList.count({ where: { organizationId: orgId } }),
      this.prisma.pickList.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      this.prisma.packingList.count({ where: { organizationId: orgId } }),
      this.prisma.packingList.count({ where: { organizationId: orgId, status: 'PACKING' } }),
    ]);
    return { totalPickLists: pickLists, openPicks, totalPackingLists: packingLists, inProgress: shipping };
  }
}
