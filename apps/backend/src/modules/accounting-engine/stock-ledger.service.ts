import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { GeneralLedgerService } from './general-ledger.service';
import { StockLedgerPostDto } from './dto/gl-entry.dto';

@Injectable()
export class StockLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly glService: GeneralLedgerService,
  ) {}

  // =========================================================================
  // CORE: Post Stock Ledger Entry (with automatic GL posting)
  // =========================================================================

  async createStockLedgerEntry(
    organizationId: string,
    userId: string,
    dto: StockLedgerPostDto,
  ) {
    const postingDate = new Date(dto.postingDate);

    // Get fiscal year
    const fy = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: postingDate },
        endDate: { gte: postingDate },
        isActive: true,
      },
    });
    if (!fy) throw new BadRequestException('No active fiscal year for this date');

    // Get current stock status for this item+warehouse
    const lastSLE = await this.prisma.stockLedgerEntry.findFirst({
      where: {
        organizationId,
        riceVarietyId: dto.riceVarietyId,
        warehouseId: dto.warehouseId,
        isCancelled: false,
      },
      orderBy: [{ postingDate: 'desc' }, { createdAt: 'desc' }],
    });

    const previousQty = lastSLE ? Number(lastSLE.qtyAfterTransaction) : 0;
    const previousRate = lastSLE ? Number(lastSLE.valuationRate) : 0;
    const previousValue = previousQty * previousRate;

    // Calculate new valuation (Moving Average)
    const actualQty = dto.actualQty;
    const qtyAfterTransaction = previousQty + actualQty;

    if (qtyAfterTransaction < 0) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${previousQty}, Requested: ${Math.abs(actualQty)}`,
      );
    }

    let valuationRate: number;
    let incomingRate = 0;
    let outgoingRate = 0;

    if (actualQty > 0) {
      // Stock IN — recalculate moving average
      incomingRate = dto.incomingRate;
      const newValue = previousValue + actualQty * incomingRate;
      valuationRate = qtyAfterTransaction > 0 ? newValue / qtyAfterTransaction : incomingRate;
    } else {
      // Stock OUT — use existing valuation rate
      outgoingRate = previousRate;
      valuationRate = previousRate;
    }

    const stockValue = qtyAfterTransaction * valuationRate;
    const stockValueDifference = stockValue - previousValue;

    return this.prisma.$transaction(async (tx) => {
      // Create Stock Ledger Entry
      const sle = await tx.stockLedgerEntry.create({
        data: {
          organizationId,
          postingDate,
          riceVarietyId: dto.riceVarietyId,
          warehouseId: dto.warehouseId,
          actualQty,
          qtyAfterTransaction,
          incomingRate,
          outgoingRate,
          valuationRate,
          stockValue,
          stockValueDifference,
          voucherType: dto.voucherType,
          voucherNo: dto.voucherNo,
          voucherId: dto.voucherId,
          batchNo: dto.batchNo,
          serialNo: dto.serialNo,
          fiscalYear: fy.name,
          remarks: dto.remarks,
          createdBy: userId,
        },
      });

      // Update InventoryItem (current snapshot)
      const inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          organizationId,
          riceVarietyId: dto.riceVarietyId,
          warehouseId: dto.warehouseId,
        },
      });

      if (inventoryItem) {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: qtyAfterTransaction,
            valuationRate,
            totalValue: stockValue,
          },
        });
      } else if (actualQty > 0) {
        await tx.inventoryItem.create({
          data: {
            organizationId,
            warehouseId: dto.warehouseId,
            riceVarietyId: dto.riceVarietyId,
            quantity: qtyAfterTransaction,
            valuationRate,
            totalValue: stockValue,
            unit: 'KG',
          },
        });
      }

      return sle;
    });
  }

  // =========================================================================
  // Post stock entry WITH GL posting (Perpetual Inventory)
  // =========================================================================

  async postStockWithGL(
    organizationId: string,
    userId: string,
    dto: StockLedgerPostDto,
    stockAccountId: string,
    counterAccountId: string,
  ) {
    // Create SLE
    const sle = await this.createStockLedgerEntry(organizationId, userId, dto);

    // Create GL entries for stock value change
    const valueChange = Math.abs(Number(sle.stockValueDifference));
    if (valueChange > 0.0001) {
      const isIncoming = dto.actualQty > 0;

      await this.glService.postToLedger(organizationId, userId, {
        voucherType: dto.voucherType,
        voucherNo: dto.voucherNo,
        voucherId: dto.voucherId,
        postingDate: dto.postingDate,
        remarks: dto.remarks || `Stock ${isIncoming ? 'receipt' : 'issue'}: ${dto.voucherNo}`,
        entries: [
          {
            accountId: stockAccountId,
            debit: isIncoming ? valueChange : 0,
            credit: isIncoming ? 0 : valueChange,
          },
          {
            accountId: counterAccountId,
            debit: isIncoming ? 0 : valueChange,
            credit: isIncoming ? valueChange : 0,
          },
        ],
      });

      // Mark SLE as having GL entry
      await this.prisma.stockLedgerEntry.update({
        where: { id: sle.id },
        data: { hasGLEntry: true },
      });
    }

    return sle;
  }

  // =========================================================================
  // REPORTS: Stock Balance
  // =========================================================================

  async getStockBalance(
    organizationId: string,
    warehouseId?: string,
    riceVarietyId?: string,
    asOfDate?: string,
  ) {
    if (asOfDate) {
      // Get balance from SLE as of a specific date
      const sles = await this.prisma.$queryRaw<Array<{
        rice_variety_id: string;
        warehouse_id: string;
        qty_after_transaction: number;
        valuation_rate: number;
        stock_value: number;
      }>>`
        SELECT DISTINCT ON (rice_variety_id, warehouse_id)
          rice_variety_id, warehouse_id,
          qty_after_transaction, valuation_rate, stock_value
        FROM stock_ledger_entries
        WHERE organization_id = ${organizationId}::uuid
          AND is_cancelled = false
          AND posting_date <= ${new Date(asOfDate)}
          ${warehouseId ? Prisma.sql`AND warehouse_id = ${warehouseId}::uuid` : Prisma.empty}
          ${riceVarietyId ? Prisma.sql`AND rice_variety_id = ${riceVarietyId}::uuid` : Prisma.empty}
        ORDER BY rice_variety_id, warehouse_id, posting_date DESC, created_at DESC
      `;

      return { asOfDate, items: sles };
    }

    // Current stock from InventoryItem snapshot
    const where: Prisma.InventoryItemWhereInput = {
      organizationId,
      ...(warehouseId ? { warehouseId } : {}),
      ...(riceVarietyId ? { riceVarietyId } : {}),
    };

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        warehouse: { select: { name: true, code: true } },
        riceVariety: { select: { name: true, code: true } },
      },
      orderBy: [{ warehouseId: 'asc' }, { riceVarietyId: 'asc' }],
    });

    const totalValue = items.reduce((sum, i) => sum + Number(i.totalValue), 0);
    const totalQty = items.reduce((sum, i) => sum + Number(i.quantity), 0);

    return {
      items,
      totalQuantity: totalQty,
      totalValue,
      itemCount: items.length,
    };
  }

  // =========================================================================
  // REPORTS: Stock Ledger (Transaction History)
  // =========================================================================

  async getStockLedgerReport(
    organizationId: string,
    riceVarietyId?: string,
    warehouseId?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: Prisma.StockLedgerEntryWhereInput = {
      organizationId,
      isCancelled: false,
      ...(riceVarietyId ? { riceVarietyId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(fromDate || toDate
        ? {
            postingDate: {
              ...(fromDate ? { gte: new Date(fromDate) } : {}),
              ...(toDate ? { lte: new Date(toDate) } : {}),
            },
          }
        : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.stockLedgerEntry.findMany({
        where,
        orderBy: [{ postingDate: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockLedgerEntry.count({ where }),
    ]);

    return { entries, total, page, limit };
  }

  // =========================================================================
  // REPORTS: Inventory Valuation Summary
  // =========================================================================

  async getInventoryValuationSummary(organizationId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { organizationId },
      include: {
        warehouse: { select: { name: true } },
        riceVariety: { select: { name: true, category: true } },
      },
    });

    const byCategory = new Map<string, { qty: number; value: number; items: number }>();
    const byWarehouse = new Map<string, { qty: number; value: number; items: number }>();

    for (const item of items) {
      const qty = Number(item.quantity);
      const value = Number(item.totalValue);
      const category = item.riceVariety?.category || 'UNCATEGORIZED';
      const warehouse = item.warehouse?.name || 'UNKNOWN';

      const cat = byCategory.get(category) || { qty: 0, value: 0, items: 0 };
      cat.qty += qty;
      cat.value += value;
      cat.items += 1;
      byCategory.set(category, cat);

      const wh = byWarehouse.get(warehouse) || { qty: 0, value: 0, items: 0 };
      wh.qty += qty;
      wh.value += value;
      wh.items += 1;
      byWarehouse.set(warehouse, wh);
    }

    return {
      totalItems: items.length,
      totalQuantity: items.reduce((s, i) => s + Number(i.quantity), 0),
      totalValue: items.reduce((s, i) => s + Number(i.totalValue), 0),
      byCategory: Object.fromEntries(byCategory),
      byWarehouse: Object.fromEntries(byWarehouse),
    };
  }
}
