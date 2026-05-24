import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductionOrderDto, CreateGoodsTransactionDto, CreateReturnRequestDto } from './dto/production-order.dto';

@Injectable()
export class ProductionOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async createProductionOrder(orgId: string, dto: CreateProductionOrderDto) {
    const count = await this.prisma.productionOrder.count({ where: { organizationId: orgId } });
    const orderNumber = `PO-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.productionOrder.create({
      data: { organizationId: orgId, orderNumber, itemCode: dto.itemCode, itemName: dto.itemName, plannedQty: dto.plannedQty, bomId: dto.bomId, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, warehouseId: dto.warehouseId, costCenterId: dto.costCenterId, projectId: dto.projectId, components: (dto.components || []) as any, operations: (dto.operations || []) as any, remarks: dto.remarks },
    });
  }

  async findAllProductionOrders(orgId: string) {
    return this.prisma.productionOrder.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async releaseOrder(orgId: string, id: string) {
    return this.prisma.productionOrder.update({ where: { id }, data: { status: 'RELEASED', actualStart: new Date() } });
  }

  async reportCompletion(orgId: string, id: string, completedQty: number, rejectedQty?: number) {
    return this.prisma.productionOrder.update({ where: { id }, data: { completedQty, rejectedQty: rejectedQty ?? 0, status: 'COMPLETED', actualEnd: new Date() } });
  }

  async closeOrder(orgId: string, id: string) {
    return this.prisma.productionOrder.update({ where: { id }, data: { status: 'CLOSED' } });
  }

  async createGoodsTransaction(orgId: string, dto: CreateGoodsTransactionDto) {
    const count = await this.prisma.goodsTransaction.count({ where: { organizationId: orgId } });
    const transactionNumber = `GT-${String(count + 1).padStart(4, '0')}`;
    const items = dto.items || [];
    const totalValue = items.reduce((s: number, i: any) => s + (i.qty || 0) * (i.unitCost || 0), 0);
    return this.prisma.goodsTransaction.create({ data: { organizationId: orgId, transactionNumber, type: dto.type, warehouseId: dto.warehouseId, reference: dto.reference, remarks: dto.remarks, costCenterId: dto.costCenterId, projectId: dto.projectId, totalValue, items: items as any } });
  }

  async findGoodsTransactions(orgId: string, type?: string) {
    const where: any = { organizationId: orgId };
    if (type) where.type = type;
    return this.prisma.goodsTransaction.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createReturnRequest(orgId: string, dto: CreateReturnRequestDto) {
    const count = await this.prisma.returnRequest.count({ where: { organizationId: orgId } });
    const requestNumber = `RR-${String(count + 1).padStart(4, '0')}`;
    const items = dto.items || [];
    const totalAmount = items.reduce((s: number, i: any) => s + (i.qty || 0) * (i.unitPrice || 0), 0);
    return this.prisma.returnRequest.create({ data: { organizationId: orgId, requestNumber, type: dto.type || 'SALES', partnerId: dto.partnerId, partnerType: dto.partnerType || 'CUSTOMER', originalDocRef: dto.originalDocRef, reason: dto.reason, totalAmount, items: items as any } });
  }

  async findReturnRequests(orgId: string) {
    return this.prisma.returnRequest.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async approveReturnRequest(orgId: string, id: string, userId: string) {
    return this.prisma.returnRequest.update({ where: { id }, data: { status: 'APPROVED', approvedById: userId } });
  }

  async getSummary(orgId: string) {
    const [prodOrders, activeProd, goodsTx, returnReqs] = await Promise.all([
      this.prisma.productionOrder.count({ where: { organizationId: orgId } }),
      this.prisma.productionOrder.count({ where: { organizationId: orgId, status: { in: ['PLANNED', 'RELEASED'] } } }),
      this.prisma.goodsTransaction.count({ where: { organizationId: orgId } }),
      this.prisma.returnRequest.count({ where: { organizationId: orgId, status: 'PENDING' } }),
    ]);
    return { totalProductionOrders: prodOrders, activeOrders: activeProd, totalGoodsTransactions: goodsTx, pendingReturns: returnReqs };
  }
}
