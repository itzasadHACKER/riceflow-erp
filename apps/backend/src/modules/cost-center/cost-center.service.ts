import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostCenterDto, CreateCostAllocationDto } from './dto/cost-center.dto';

@Injectable()
export class CostCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, dto: CreateCostCenterDto) {
    return this.prisma.costCenter.create({ data: { organizationId: orgId, code: dto.code, name: dto.name, description: dto.description, type: dto.type || 'COST', parentId: dto.parentId, managerId: dto.managerId, budgetAmount: dto.budgetAmount ?? 0 } });
  }

  async findAll(orgId: string) {
    return this.prisma.costCenter.findMany({ where: { organizationId: orgId }, include: { allocations: true }, orderBy: { code: 'asc' } });
  }

  async findOne(orgId: string, id: string) {
    const cc = await this.prisma.costCenter.findFirst({ where: { id, organizationId: orgId }, include: { allocations: true } });
    if (!cc) throw new NotFoundException('Cost center not found');
    return cc;
  }

  async update(orgId: string, id: string, data: Partial<CreateCostCenterDto>) {
    await this.findOne(orgId, id);
    return this.prisma.costCenter.update({ where: { id }, data: data as any });
  }

  async createAllocation(dto: CreateCostAllocationDto) {
    return this.prisma.costAllocation.create({ data: { costCenterId: dto.costCenterId, targetCenterId: dto.targetCenterId, percentage: dto.percentage, description: dto.description, effectiveDate: new Date(dto.effectiveDate) } });
  }

  async findAllocations(costCenterId: string) {
    return this.prisma.costAllocation.findMany({ where: { costCenterId, isActive: true } });
  }

  async getSummary(orgId: string) {
    const [total, costCenters, profitCenters] = await Promise.all([
      this.prisma.costCenter.count({ where: { organizationId: orgId } }),
      this.prisma.costCenter.count({ where: { organizationId: orgId, type: 'COST' } }),
      this.prisma.costCenter.count({ where: { organizationId: orgId, type: 'PROFIT' } }),
    ]);
    return { total, costCenters, profitCenters };
  }
}
