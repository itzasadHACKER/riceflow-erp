import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateInventoryItemDto,
  CreateStockMovementDto,
  CreateStockAdjustmentDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== WAREHOUSES =====

  async createWarehouse(organizationId: string, dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { organizationId_code: { organizationId, code: dto.code } },
    });
    if (existing)
      throw new ConflictException(`Warehouse code ${dto.code} already exists`);

    return this.prisma.warehouse.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        branchId: dto.branchId,
        address: dto.address,
        capacity: dto.capacity,
        capacityUnit: dto.capacityUnit ?? 'TON',
        managerId: dto.managerId,
      },
      include: { branch: true },
    });
  }

  async listWarehouses(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
      include: {
        branch: true,
        _count: { select: { inventoryItems: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getWarehouse(organizationId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        branch: true,
        inventoryItems: {
          include: { riceVariety: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async updateWarehouse(
    organizationId: string,
    id: string,
    dto: UpdateWarehouseDto,
  ) {
    await this.getWarehouse(organizationId, id);
    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
      include: { branch: true },
    });
  }

  async getWarehouseStock(organizationId: string, warehouseId: string) {
    await this.getWarehouse(organizationId, warehouseId);

    const items = await this.prisma.inventoryItem.findMany({
      where: { warehouseId, organizationId },
      include: { riceVariety: true },
      orderBy: { riceVariety: { name: 'asc' } },
    });

    const totalQuantity = items.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.totalValue),
      0,
    );

    return { items, totalQuantity, totalValue };
  }

  // ===== INVENTORY ITEMS =====

  async createInventoryItem(
    organizationId: string,
    dto: CreateInventoryItemDto,
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId },
    });
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const variety = await this.prisma.riceVariety.findFirst({
      where: { id: dto.riceVarietyId, organizationId },
    });
    if (!variety) throw new NotFoundException('Rice variety not found');

    const valuationRate = dto.valuationRate ?? 0;
    const totalValue = dto.quantity * valuationRate;

    return this.prisma.inventoryItem.create({
      data: {
        organizationId,
        warehouseId: dto.warehouseId,
        riceVarietyId: dto.riceVarietyId,
        lotNumber: dto.lotNumber,
        batchNumber: dto.batchNumber,
        quantity: dto.quantity,
        unit: dto.unit ?? 'KG',
        bagCount: dto.bagCount,
        bagWeight: dto.bagWeight,
        qualityGrade: dto.qualityGrade as
          | 'A_PLUS'
          | 'A'
          | 'B'
          | 'C'
          | 'REJECT'
          | undefined,
        moisture: dto.moisture,
        valuationRate,
        totalValue,
      },
      include: { warehouse: true, riceVariety: true },
    });
  }

  async listInventoryItems(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    warehouseId?: string,
    riceVarietyId?: string,
  ) {
    const where: Prisma.InventoryItemWhereInput = {
      organizationId,
      ...(warehouseId ? { warehouseId } : {}),
      ...(riceVarietyId ? { riceVarietyId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        include: { warehouse: true, riceVariety: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== STOCK MOVEMENTS =====

  async createStockMovement(
    organizationId: string,
    userId: string,
    dto: CreateStockMovementDto,
  ) {
    const movType = String(dto.movementType);
    if (movType === 'TRANSFER') {
      if (!dto.sourceWarehouseId || !dto.destinationWarehouseId) {
        throw new BadRequestException(
          'Transfer requires both source and destination warehouses',
        );
      }
      if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
        throw new BadRequestException(
          'Source and destination warehouses must be different',
        );
      }
    }

    if (movType === 'IN' && !dto.destinationWarehouseId) {
      throw new BadRequestException(
        'Inbound movement requires destination warehouse',
      );
    }

    if (movType === 'OUT' && !dto.sourceWarehouseId) {
      throw new BadRequestException(
        'Outbound movement requires source warehouse',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          movementType: dto.movementType,
          sourceWarehouseId: dto.sourceWarehouseId,
          destinationWarehouseId: dto.destinationWarehouseId,
          riceVarietyId: dto.riceVarietyId,
          quantity: dto.quantity,
          unit: dto.unit ?? 'KG',
          referenceType: dto.referenceType,
          referenceId: dto.referenceId,
          movementDate: new Date(dto.movementDate),
          narration: dto.narration,
          createdBy: userId,
        },
      });

      if (movType === 'OUT' || movType === 'TRANSFER') {
        if (dto.sourceWarehouseId && dto.riceVarietyId) {
          const sourceItem = await tx.inventoryItem.findFirst({
            where: {
              warehouseId: dto.sourceWarehouseId,
              riceVarietyId: dto.riceVarietyId,
              organizationId,
            },
          });
          if (sourceItem) {
            const newQty = Number(sourceItem.quantity) - dto.quantity;
            if (newQty < 0)
              throw new BadRequestException(
                'Insufficient stock in source warehouse',
              );
            await tx.inventoryItem.update({
              where: { id: sourceItem.id },
              data: {
                quantity: newQty,
                totalValue: newQty * Number(sourceItem.valuationRate),
              },
            });
          }
        }
      }

      if (movType === 'IN' || movType === 'TRANSFER') {
        if (dto.destinationWarehouseId && dto.riceVarietyId) {
          const destItem = await tx.inventoryItem.findFirst({
            where: {
              warehouseId: dto.destinationWarehouseId,
              riceVarietyId: dto.riceVarietyId,
              organizationId,
            },
          });
          if (destItem) {
            const newQty = Number(destItem.quantity) + dto.quantity;
            await tx.inventoryItem.update({
              where: { id: destItem.id },
              data: {
                quantity: newQty,
                totalValue: newQty * Number(destItem.valuationRate),
              },
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                organizationId,
                warehouseId: dto.destinationWarehouseId,
                riceVarietyId: dto.riceVarietyId,
                quantity: dto.quantity,
                unit: dto.unit ?? 'KG',
                valuationRate: 0,
                totalValue: 0,
              },
            });
          }
        }
      }

      return movement;
    });
  }

  async listStockMovements(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    warehouseId?: string,
    fromDate?: string,
    toDate?: string,
  ) {
    const where: Prisma.StockMovementWhereInput = {
      organizationId,
    };

    if (warehouseId) {
      where.OR = [
        { sourceWarehouseId: warehouseId },
        { destinationWarehouseId: warehouseId },
      ];
    }

    if (fromDate || toDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.movementDate = dateFilter;
    }

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
        },
        orderBy: { movementDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== STOCK ADJUSTMENTS =====

  async createStockAdjustment(
    organizationId: string,
    userId: string,
    dto: CreateStockAdjustmentDto,
  ) {
    await this.getWarehouse(organizationId, dto.warehouseId);

    const count = await this.prisma.stockAdjustment.count({
      where: { organizationId },
    });
    const adjustmentNumber = `SA-${String(count + 1).padStart(6, '0')}`;

    return this.prisma.stockAdjustment.create({
      data: {
        organizationId,
        warehouseId: dto.warehouseId,
        adjustmentNumber,
        date: new Date(dto.adjustmentDate),
        riceVarietyId: dto.riceVarietyId,
        quantityChange: dto.quantityChange,
        previousQuantity: dto.previousQuantity,
        newQuantity: dto.newQuantity,
        reason: dto.reason,
      },
    });
  }

  // ===== INVENTORY SUMMARY =====

  async getInventorySummary(organizationId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { organizationId },
      include: { warehouse: true, riceVariety: true },
    });

    const byWarehouse: Record<
      string,
      { name: string; totalQty: number; totalValue: number; items: number }
    > = {};
    const byVariety: Record<
      string,
      { name: string; totalQty: number; totalValue: number }
    > = {};

    let grandTotalQty = 0;
    let grandTotalValue = 0;

    for (const item of items) {
      const qty = Number(item.quantity);
      const value = Number(item.totalValue);
      grandTotalQty += qty;
      grandTotalValue += value;

      if (!byWarehouse[item.warehouseId]) {
        byWarehouse[item.warehouseId] = {
          name: item.warehouse.name,
          totalQty: 0,
          totalValue: 0,
          items: 0,
        };
      }
      byWarehouse[item.warehouseId].totalQty += qty;
      byWarehouse[item.warehouseId].totalValue += value;
      byWarehouse[item.warehouseId].items++;

      if (!byVariety[item.riceVarietyId]) {
        byVariety[item.riceVarietyId] = {
          name: item.riceVariety.name,
          totalQty: 0,
          totalValue: 0,
        };
      }
      byVariety[item.riceVarietyId].totalQty += qty;
      byVariety[item.riceVarietyId].totalValue += value;
    }

    return {
      grandTotalQuantity: grandTotalQty,
      grandTotalValue: grandTotalValue,
      byWarehouse: Object.values(byWarehouse),
      byVariety: Object.values(byVariety),
    };
  }

  // ============================================================================
  // WAREHOUSE ZONES & BINS
  // ============================================================================

  async createZone(organizationId: string, data: { warehouseId: string; name: string; code: string; zoneType?: string; description?: string }) {
    return this.prisma.warehouseZone.create({
      data: { organizationId, warehouseId: data.warehouseId, name: data.name, code: data.code, zoneType: data.zoneType, description: data.description },
    });
  }

  async getZones(organizationId: string, warehouseId: string) {
    return this.prisma.warehouseZone.findMany({
      where: { organizationId, warehouseId },
      include: { bins: true },
    });
  }

  async createBin(organizationId: string, data: { zoneId: string; binCode: string; rack?: string; shelf?: string; capacity?: string; capacityUnit?: string }) {
    return this.prisma.warehouseBin.create({
      data: {
        organizationId,
        zoneId: data.zoneId,
        binCode: data.binCode,
        rack: data.rack,
        shelf: data.shelf,
        capacity: data.capacity ? new Prisma.Decimal(data.capacity) : undefined,
        capacityUnit: data.capacityUnit,
      },
    });
  }

  // ============================================================================
  // CYCLE COUNTING
  // ============================================================================

  async createCycleCount(organizationId: string, data: { warehouseId: string; countDate: string; notes?: string }, countedBy?: string) {
    const series = await this.prisma.numberingSeries.findFirst({
      where: { organizationId, entityType: 'CYCLE_COUNT' },
    });
    const currentNumber = series ? series.currentNumber + 1 : 1;
    const countNumber = `CC-${String(currentNumber).padStart(6, '0')}`;
    if (series) {
      await this.prisma.numberingSeries.update({ where: { id: series.id }, data: { currentNumber } });
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: { organizationId, warehouseId: data.warehouseId },
    });

    return this.prisma.$transaction(async (tx) => {
      const cycleCount = await tx.cycleCount.create({
        data: {
          organizationId,
          warehouseId: data.warehouseId,
          countNumber,
          countDate: new Date(data.countDate),
          countedBy,
          notes: data.notes,
        },
      });

      for (const item of items) {
        await tx.cycleCountItem.create({
          data: {
            cycleCountId: cycleCount.id,
            inventoryItemId: item.id,
            riceVarietyId: item.riceVarietyId,
            systemQuantity: item.quantity,
          },
        });
      }

      return tx.cycleCount.findFirst({
        where: { id: cycleCount.id },
        include: { items: true },
      });
    });
  }

  async getCycleCounts(organizationId: string, warehouseId?: string) {
    const where: Prisma.CycleCountWhereInput = { organizationId };
    if (warehouseId) where.warehouseId = warehouseId;
    return this.prisma.cycleCount.findMany({
      where,
      include: { items: true },
      orderBy: { countDate: 'desc' },
    });
  }

  async updateCountedQuantity(cycleCountItemId: string, countedQuantity: string) {
    const counted = new Prisma.Decimal(countedQuantity);
    const item = await this.prisma.cycleCountItem.findFirst({ where: { id: cycleCountItemId } });
    if (!item) throw new NotFoundException('Cycle count item not found');
    const variance = counted.sub(item.systemQuantity);
    return this.prisma.cycleCountItem.update({
      where: { id: cycleCountItemId },
      data: { countedQuantity: counted, variance },
    });
  }

  async completeCycleCount(organizationId: string, cycleCountId: string, approvedBy?: string) {
    return this.prisma.cycleCount.update({
      where: { id: cycleCountId },
      data: { status: 'COMPLETED_COUNT', approvedBy },
      include: { items: true },
    });
  }

  // ============================================================================
  // STOCK RESERVATIONS
  // ============================================================================

  async createReservation(
    organizationId: string,
    data: { inventoryItemId: string; quantity: string; referenceType: string; referenceId: string; expiryDate?: string },
    reservedBy?: string,
  ) {
    return this.prisma.stockReservation.create({
      data: {
        organizationId,
        inventoryItemId: data.inventoryItemId,
        quantity: new Prisma.Decimal(data.quantity),
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        reservedBy,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }

  async getReservations(organizationId: string, inventoryItemId?: string) {
    const where: Prisma.StockReservationWhereInput = { organizationId, isReleased: false };
    if (inventoryItemId) where.inventoryItemId = inventoryItemId;
    return this.prisma.stockReservation.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async releaseReservation(organizationId: string, reservationId: string) {
    return this.prisma.stockReservation.update({
      where: { id: reservationId },
      data: { isReleased: true },
    });
  }

  async getAvailableStock(organizationId: string, inventoryItemId: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { id: inventoryItemId, organizationId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const reservations = await this.prisma.stockReservation.aggregate({
      where: { organizationId, inventoryItemId, isReleased: false },
      _sum: { quantity: true },
    });

    const reserved = Number(reservations._sum.quantity ?? 0);
    const available = Number(item.quantity) - reserved;

    return {
      totalQuantity: Number(item.quantity),
      reserved,
      available: available > 0 ? available : 0,
    };
  }
}
