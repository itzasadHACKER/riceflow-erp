import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBomDto } from './dto/bom.dto';

@Injectable()
export class BomService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateBomDto) {
    const count = await this.prisma.billOfMaterial.count({ where: { organizationId } });
    const code = `BOM-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.billOfMaterial.create({
      data: {
        organizationId,
        name: dto.name,
        code,
        outputVarietyId: dto.outputVarietyId,
        outputQuantity: dto.outputQuantity,
        processType: dto.processType as 'SHELLING' | 'POLISHING' | 'SELLA' | 'STEAM' | 'SORTING' | 'GRADING' | 'CLEANING',
        isActive: dto.isActive ?? true,
        items: {
          create: dto.items.map((item) => ({
            riceVarietyId: item.riceVarietyId,
            quantity: item.quantity,
            unit: item.unit ?? 'KG',
          })),
        },
      },
      include: { items: { include: { riceVariety: true } }, outputVariety: true },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.billOfMaterial.findMany({
      where: { organizationId },
      include: { items: { include: { riceVariety: true } }, outputVariety: true, _count: { select: { workOrders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const bom = await this.prisma.billOfMaterial.findFirst({
      where: { id, organizationId },
      include: { items: { include: { riceVariety: true } }, outputVariety: true, workOrders: true },
    });
    if (!bom) throw new NotFoundException('BOM not found');
    return bom;
  }

  async delete(organizationId: string, id: string) {
    const bom = await this.findOne(organizationId, id);
    await this.prisma.billOfMaterial.delete({ where: { id: bom.id } });
    return { message: 'BOM deleted' };
  }

  async toggleActive(organizationId: string, id: string) {
    const bom = await this.findOne(organizationId, id);
    return this.prisma.billOfMaterial.update({
      where: { id: bom.id },
      data: { isActive: !bom.isActive },
      include: { items: { include: { riceVariety: true } }, outputVariety: true },
    });
  }
}
