import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBatchDto, CreateSerialNumberDto } from './dto/batch-serial.dto';

@Injectable()
export class BatchSerialService {
  constructor(private readonly prisma: PrismaService) {}

  async createBatch(orgId: string, dto: CreateBatchDto) {
    return this.prisma.batchRecord.create({
      data: { organizationId: orgId, batchNumber: dto.batchNumber, itemCode: dto.itemCode, quantity: dto.quantity, expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined, manufacturingDate: dto.manufacturingDate ? new Date(dto.manufacturingDate) : undefined, supplierBatch: dto.supplierBatch, warehouseId: dto.warehouseId, notes: dto.notes },
    });
  }

  async findAllBatches(orgId: string, itemCode?: string) {
    const where: any = { organizationId: orgId };
    if (itemCode) where.itemCode = itemCode;
    return this.prisma.batchRecord.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findBatch(orgId: string, id: string) {
    const batch = await this.prisma.batchRecord.findFirst({ where: { id, organizationId: orgId } });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async expiringBatches(orgId: string, days: number = 30) {
    const futureDate = new Date(); futureDate.setDate(futureDate.getDate() + days);
    return this.prisma.batchRecord.findMany({ where: { organizationId: orgId, status: 'AVAILABLE', expiryDate: { lte: futureDate } }, orderBy: { expiryDate: 'asc' } });
  }

  async createSerialNumber(orgId: string, dto: CreateSerialNumberDto) {
    return this.prisma.serialNumber.create({
      data: { organizationId: orgId, serialNumber: dto.serialNumber, itemCode: dto.itemCode, warehouseId: dto.warehouseId, warrantyStart: dto.warrantyStart ? new Date(dto.warrantyStart) : undefined, warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined, notes: dto.notes },
    });
  }

  async findAllSerialNumbers(orgId: string, itemCode?: string) {
    const where: any = { organizationId: orgId };
    if (itemCode) where.itemCode = itemCode;
    return this.prisma.serialNumber.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findSerialHistory(orgId: string, serialNum: string) {
    return this.prisma.serialNumber.findFirst({ where: { organizationId: orgId, serialNumber: serialNum } });
  }

  async updateSerialStatus(orgId: string, id: string, status: string, customerId?: string, salesDocRef?: string) {
    return this.prisma.serialNumber.update({ where: { id }, data: { status, customerId, salesDocRef } });
  }

  async getSummary(orgId: string) {
    const [batches, availableBatches, serialNumbers, availableSerials] = await Promise.all([
      this.prisma.batchRecord.count({ where: { organizationId: orgId } }),
      this.prisma.batchRecord.count({ where: { organizationId: orgId, status: 'AVAILABLE' } }),
      this.prisma.serialNumber.count({ where: { organizationId: orgId } }),
      this.prisma.serialNumber.count({ where: { organizationId: orgId, status: 'AVAILABLE' } }),
    ]);
    return { totalBatches: batches, availableBatches, totalSerialNumbers: serialNumbers, availableSerials };
  }
}
