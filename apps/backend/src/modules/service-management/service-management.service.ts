import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateServiceCallDto, UpdateServiceCallDto, CreateServiceContractDto, CreateEquipmentCardDto, CreateServiceSolutionDto } from './dto/service-management.dto';

@Injectable()
export class ServiceManagementService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextNumber(orgId: string, prefix: string): Promise<string> {
    const count = await this.prisma.serviceCall.count({ where: { organizationId: orgId } });
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  async createServiceCall(orgId: string, dto: CreateServiceCallDto) {
    const callNumber = await this.nextNumber(orgId, 'SC');
    return this.prisma.serviceCall.create({
      data: { organizationId: orgId, callNumber, ...dto, priority: (dto.priority as any) || 'MEDIUM' },
      include: { customer: { select: { id: true, name: true, company: true } } },
    });
  }

  async findAllServiceCalls(orgId: string) {
    return this.prisma.serviceCall.findMany({
      where: { organizationId: orgId },
      include: { customer: { select: { id: true, name: true, company: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findServiceCall(orgId: string, id: string) {
    const call = await this.prisma.serviceCall.findFirst({ where: { id, organizationId: orgId }, include: { customer: true } });
    if (!call) throw new NotFoundException('Service call not found');
    return call;
  }

  async updateServiceCall(orgId: string, id: string, dto: UpdateServiceCallDto) {
    await this.findServiceCall(orgId, id);
    const data: any = { ...dto };
    if (dto.status === 'RESOLVED') data.resolutionDate = new Date();
    if (dto.status === 'CLOSED') data.closedAt = new Date();
    return this.prisma.serviceCall.update({ where: { id }, data });
  }

  async createContract(orgId: string, dto: CreateServiceContractDto) {
    const count = await this.prisma.serviceContract.count({ where: { organizationId: orgId } });
    const contractNumber = `SCT-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.serviceContract.create({
      data: { organizationId: orgId, contractNumber, customerId: dto.customerId, contractType: dto.contractType, description: dto.description, startDate: new Date(dto.startDate), endDate: new Date(dto.endDate), responseTimeSla: dto.responseTimeSla, resolutionTimeSla: dto.resolutionTimeSla, value: dto.value },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async findAllContracts(orgId: string) {
    return this.prisma.serviceContract.findMany({ where: { organizationId: orgId }, include: { customer: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async expiringContracts(orgId: string) {
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    return this.prisma.serviceContract.findMany({ where: { organizationId: orgId, isActive: true, endDate: { lte: thirtyDays } }, include: { customer: { select: { id: true, name: true } } } });
  }

  async createEquipmentCard(orgId: string, dto: CreateEquipmentCardDto) {
    const count = await this.prisma.equipmentCard.count({ where: { organizationId: orgId } });
    const equipmentNumber = `EQ-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.equipmentCard.create({
      data: { organizationId: orgId, equipmentNumber, customerId: dto.customerId, itemCode: dto.itemCode, itemName: dto.itemName, serialNumber: dto.serialNumber, manufacturer: dto.manufacturer, model: dto.model, warrantyStart: dto.warrantyStart ? new Date(dto.warrantyStart) : undefined, warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined, location: dto.location },
      include: { customer: { select: { id: true, name: true } } },
    });
  }

  async findAllEquipment(orgId: string) {
    return this.prisma.equipmentCard.findMany({ where: { organizationId: orgId }, include: { customer: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async createSolution(orgId: string, dto: CreateServiceSolutionDto) {
    return this.prisma.serviceSolution.create({ data: { organizationId: orgId, ...dto } });
  }

  async findAllSolutions(orgId: string) {
    return this.prisma.serviceSolution.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async searchSolutions(orgId: string, query: string) {
    return this.prisma.serviceSolution.findMany({
      where: { organizationId: orgId, OR: [{ title: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }, { resolution: { contains: query, mode: 'insensitive' } }] },
    });
  }

  async getSummary(orgId: string) {
    const [totalCalls, openCalls, contracts, equipment] = await Promise.all([
      this.prisma.serviceCall.count({ where: { organizationId: orgId } }),
      this.prisma.serviceCall.count({ where: { organizationId: orgId, status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] } } }),
      this.prisma.serviceContract.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.equipmentCard.count({ where: { organizationId: orgId } }),
    ]);
    return { totalCalls, openCalls, activeContracts: contracts, equipmentCards: equipment };
  }
}
