import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class InventoryEnhancedService {
  constructor(private prisma: PrismaService) {}

  // ─── Transfer Requests ─────────────────────────────────────
  async createTransferRequest(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.stockMovement.count({
      where: { organizationId: orgId, movementType: 'TRANSFER' },
    });
    const ref = `TRF-${String(count + 1).padStart(4, '0')}`;

    const results = [];
    for (const item of dto.items) {
      const movement = await this.prisma.stockMovement.create({
        data: {
          organizationId: orgId,
          movementType: 'TRANSFER',
          sourceWarehouseId: dto.fromWarehouseId,
          destinationWarehouseId: dto.toWarehouseId,
          riceVarietyId: item.riceVarietyId || null,
          quantity: item.quantity,
          referenceType: 'TRANSFER_REQUEST',
          movementDate: new Date(),
          narration: dto.reason || `Transfer ${ref}`,
          createdBy: userId,
        },
      });
      results.push(movement);
    }

    return { reference: ref, transfers: results };
  }

  async findTransferRequests(orgId: string) {
    return this.prisma.stockMovement.findMany({
      where: { organizationId: orgId, movementType: 'TRANSFER' },
      include: { sourceWarehouse: true, destinationWarehouse: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ─── Inventory Counting ────────────────────────────────────
  async createInventoryCount(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.cycleCount.count({ where: { organizationId: orgId } });
    const countNumber = `IC-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.cycleCount.create({
      data: {
        organizationId: orgId,
        warehouseId: dto.warehouseId,
        countNumber,
        countDate: new Date(dto.countDate),
        status: 'PLANNED',
        countedBy: userId,
        items: {
          create: dto.items.map((item: { itemId: string; systemQty: number; actualQty: number }) => ({
            inventoryItemId: item.itemId,
            systemQuantity: item.systemQty,
            countedQuantity: item.actualQty,
            variance: item.actualQty - item.systemQty,
          })),
        },
      },
      include: { items: true },
    });
  }

  async postInventoryCount(orgId: string, userId: string, countId: string) {
    const cnt = await this.prisma.cycleCount.findFirst({
      where: { id: countId, organizationId: orgId },
      include: { items: true },
    });
    if (!cnt) throw new NotFoundException('Count not found');

    for (const item of cnt.items) {
      const variance = Number(item.variance || 0);
      if (variance !== 0 && item.inventoryItemId) {
        await this.prisma.stockMovement.create({
          data: {
            organizationId: orgId,
            movementType: variance > 0 ? 'IN' : 'OUT',
            sourceWarehouseId: variance < 0 ? cnt.warehouseId : undefined,
            destinationWarehouseId: variance > 0 ? cnt.warehouseId : undefined,
            quantity: Math.abs(variance),
            referenceType: 'CYCLE_COUNT',
            referenceId: countId,
            movementDate: new Date(),
            narration: `Inventory count adjustment - ${cnt.countNumber}`,
            createdBy: userId,
          },
        });

        await this.prisma.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { increment: variance } },
        });
      }
    }

    return this.prisma.cycleCount.update({
      where: { id: countId },
      data: { status: 'COMPLETED_COUNT' },
      include: { items: true },
    });
  }

  // ─── Item Master Enhancements ─────────────────────────────
  async findItemsWithDetails(orgId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      include: { warehouse: true, riceVariety: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Summary ────────────────────────────────────────────────
  async getInventoryEnhancedSummary(orgId: string) {
    const [transfers, pendingCounts, items] = await Promise.all([
      this.prisma.stockMovement.count({ where: { organizationId: orgId, movementType: 'TRANSFER' } }),
      this.prisma.cycleCount.count({ where: { organizationId: orgId, status: 'PLANNED' } }),
      this.prisma.inventoryItem.count({ where: { organizationId: orgId } }),
    ]);
    return { transfers, pendingCounts, totalItems: items };
  }
}
