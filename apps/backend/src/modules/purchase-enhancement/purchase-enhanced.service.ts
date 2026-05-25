import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PurchaseEnhancedService {
  constructor(private prisma: PrismaService) {}

  // ─── Purchase Blanket Agreements ────────────────────────────
  async createPurchaseBlanketAgreement(orgId: string, _userId: string, dto: any) {
    const count = await this.prisma.blanketAgreement.count({ where: { organizationId: orgId } });
    return this.prisma.blanketAgreement.create({
      data: {
        organizationId: orgId,
        agreementNumber: `PBA-${String(count + 1).padStart(4, '0')}`,
        type: 'PURCHASE',
        partnerId: dto.supplierId,
        partnerType: 'SUPPLIER',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        plannedAmount: dto.plannedAmount,
        method: dto.method || 'AMOUNT',
        terms: dto.description || null,
      },
    });
  }

  async findPurchaseBlanketAgreements(orgId: string) {
    return this.prisma.blanketAgreement.findMany({
      where: { organizationId: orgId, type: 'PURCHASE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── 3-Way Matching ────────────────────────────────────────
  async threeWayMatch(orgId: string, purchaseOrderId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: purchaseOrderId, organizationId: orgId },
      include: { items: true, supplier: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    const goodsReceipts = await this.prisma.goodsReceipt.findMany({
      where: { organizationId: orgId, purchaseOrderId },
      include: { items: true },
    });

    const purchases = await this.prisma.paddyPurchase.findMany({
      where: { organizationId: orgId, supplierId: po.supplierId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const poTotal = po.items.reduce((s, i) => s + Number(i.quantity) * Number(i.rate), 0);
    const grTotal = goodsReceipts.reduce((s, gr) => s + gr.items.reduce((s2, i) => s2 + Number(i.quantity), 0), 0);
    const invoiceTotal = purchases.reduce((s, p) => s + Number(p.netAmount), 0);

    const poVsGr = Math.abs(poTotal - grTotal);
    const poVsInvoice = Math.abs(poTotal - invoiceTotal);
    const grVsInvoice = Math.abs(grTotal - invoiceTotal);

    return {
      purchaseOrder: { id: po.id, number: po.orderNumber, total: poTotal },
      goodsReceipts: { count: goodsReceipts.length, total: grTotal },
      invoices: { count: purchases.length, total: invoiceTotal },
      matching: {
        poVsGrVariance: poVsGr,
        poVsInvoiceVariance: poVsInvoice,
        grVsInvoiceVariance: grVsInvoice,
        isMatched: poVsGr < 0.01 && poVsInvoice < 0.01 && grVsInvoice < 0.01,
        status: poVsGr < 0.01 && poVsInvoice < 0.01 ? 'MATCHED' : 'VARIANCE_DETECTED',
      },
    };
  }

  // ─── Landed Costs ──────────────────────────────────────────
  async calculateLandedCosts(orgId: string, dto: any) {
    const gr = await this.prisma.goodsReceipt.findFirst({
      where: { id: dto.goodsReceiptId, organizationId: orgId },
      include: { items: true },
    });
    if (!gr) throw new NotFoundException('Goods receipt not found');

    const itemsTotal = gr.items.reduce((s, i) => s + Number(i.quantity), 0);
    const totalLandedCost = dto.costs.reduce((s: number, c: any) => s + c.amount, 0);

    const allocatedItems = gr.items.map(item => {
      const itemValue = Number(item.quantity);
      const proportion = itemsTotal > 0 ? itemValue / itemsTotal : 0;
      const allocatedCost = totalLandedCost * proportion;

      return {
        itemId: item.id,
        originalQuantity: itemValue,
        allocatedLandedCost: allocatedCost,
        totalCost: itemValue + allocatedCost,
      };
    });

    return {
      goodsReceiptId: dto.goodsReceiptId,
      costs: dto.costs,
      totalLandedCost,
      items: allocatedItems,
    };
  }

  // ─── AP Credit Memo ────────────────────────────────────────
  async createApCreditMemo(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.debitNote.count({ where: { organizationId: orgId } });
    const noteNumber = `APCM-${String(count + 1).padStart(4, '0')}`;
    const netAmount = dto.totalAmount - (dto.taxAmount || 0);

    return this.prisma.debitNote.create({
      data: {
        organizationId: orgId,
        noteNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId || null,
        totalAmount: dto.totalAmount,
        taxAmount: dto.taxAmount || 0,
        netAmount,
        reason: dto.reason || 'AP Credit Memo',
        narration: dto.narration,
        createdBy: userId,
      },
      include: { supplier: true },
    });
  }

  // ─── Goods Return to Vendor ────────────────────────────────
  async createGoodsReturn(orgId: string, userId: string, dto: any) {
    const count = await this.prisma.purchaseReturn.count({ where: { organizationId: orgId } });
    const returnNumber = `GR-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.purchaseReturn.create({
      data: {
        organizationId: orgId,
        returnNumber,
        date: new Date(dto.date),
        supplierId: dto.supplierId,
        purchaseId: dto.purchaseId || null,
        warehouseId: dto.warehouseId || null,
        quantity: dto.quantity,
        rate: dto.rate,
        totalAmount: dto.quantity * dto.rate,
        reason: dto.reason || 'Goods return to vendor',
        createdBy: userId,
      },
      include: { supplier: true },
    });
  }

  // ─── Summary ────────────────────────────────────────────────
  async getPurchaseEnhancedSummary(orgId: string) {
    const [blanketAgreements, purchaseReturns] = await Promise.all([
      this.prisma.blanketAgreement.count({ where: { organizationId: orgId, type: 'PURCHASE' } }),
      this.prisma.purchaseReturn.count({ where: { organizationId: orgId } }),
    ]);
    return { blanketAgreements, purchaseReturns };
  }
}
