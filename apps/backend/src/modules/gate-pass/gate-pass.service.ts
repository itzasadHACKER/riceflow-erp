import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGatePassDto, UpdateGatePassStatusDto } from './dto/gate-pass.dto';

@Injectable()
export class GatePassService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateGatePassDto, userId: string) {
    const count = await this.prisma.gatePass.count({ where: { organizationId } });
    const prefix = dto.type === 'OUTGOING' ? 'GP-OUT' : dto.type === 'INCOMING' ? 'GP-IN' : 'GP-VIS';
    const gatePassNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.gatePass.create({
      data: {
        organizationId,
        gatePassNumber,
        type: dto.type,
        date: dto.date ? new Date(dto.date) : new Date(),
        vehicleNumber: dto.vehicleNumber,
        driverName: dto.driverName,
        driverPhone: dto.driverPhone,
        remarks: dto.remarks,
        outgoingCategory: dto.outgoingCategory,
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId,
        deliveryChallanId: dto.deliveryChallanId,
        incomingCategory: dto.incomingCategory,
        supplierId: dto.supplierId,
        purchaseOrderId: dto.purchaseOrderId,
        visitorName: dto.visitorName,
        visitorPhone: dto.visitorPhone,
        visitorCompany: dto.visitorCompany,
        visitorEmail: dto.visitorEmail,
        visitorIdType: dto.visitorIdType,
        visitorIdNumber: dto.visitorIdNumber,
        personToMeet: dto.personToMeet,
        department: dto.department,
        purpose: dto.purpose,
        expectedDuration: dto.expectedDuration,
        badgeNumber: dto.badgeNumber,
        items: dto.items
          ? { create: dto.items.map((item) => ({ ...item, quantity: item.quantity })) }
          : undefined,
      },
      include: { items: true, approvedBy: true },
    });
  }

  async findAll(organizationId: string, type?: string, status?: string) {
    const where: Record<string, unknown> = { organizationId };
    if (type) where.type = type;
    if (status) where.status = status;

    return this.prisma.gatePass.findMany({
      where,
      include: { items: true, approvedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const gatePass = await this.prisma.gatePass.findFirst({
      where: { id, organizationId },
      include: { items: true, approvedBy: true },
    });
    if (!gatePass) throw new NotFoundException('Gate pass not found');
    return gatePass;
  }

  async updateStatus(organizationId: string, id: string, dto: UpdateGatePassStatusDto, userId: string) {
    const gatePass = await this.findOne(organizationId, id);
    const updateData: Record<string, unknown> = { status: dto.status };

    if (dto.status === 'APPROVED') {
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    } else if (dto.status === 'CHECKED_OUT') {
      updateData.checkOutTime = new Date();
    } else if (dto.status === 'CHECKED_IN' || dto.status === 'COMPLETED') {
      updateData.checkInTime = new Date();
    }

    return this.prisma.gatePass.update({
      where: { id: gatePass.id },
      data: updateData,
      include: { items: true, approvedBy: true },
    });
  }

  async delete(organizationId: string, id: string) {
    const gatePass = await this.findOne(organizationId, id);
    await this.prisma.gatePass.delete({ where: { id: gatePass.id } });
    return { message: 'Gate pass deleted' };
  }

  async getSummary(organizationId: string) {
    const [total, outgoing, incoming, visitor, pending, completed] = await Promise.all([
      this.prisma.gatePass.count({ where: { organizationId } }),
      this.prisma.gatePass.count({ where: { organizationId, type: 'OUTGOING' } }),
      this.prisma.gatePass.count({ where: { organizationId, type: 'INCOMING' } }),
      this.prisma.gatePass.count({ where: { organizationId, type: 'VISITOR' } }),
      this.prisma.gatePass.count({ where: { organizationId, status: 'DRAFT' } }),
      this.prisma.gatePass.count({ where: { organizationId, status: 'COMPLETED' } }),
    ]);
    return { total, outgoing, incoming, visitor, pending, completed };
  }
}
