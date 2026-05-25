import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDefinedTableDto, CreateAuthorizationGroupDto } from './dto/admin-enhancement.dto';

@Injectable()
export class AdminEnhancementService {
  constructor(private readonly prisma: PrismaService) {}

  async createUDT(orgId: string, dto: CreateUserDefinedTableDto) {
    const existing = await this.prisma.userDefinedTable.findUnique({ where: { organizationId_tableName: { organizationId: orgId, tableName: dto.tableName } } });
    if (existing) throw new ConflictException('Table name already exists');
    return this.prisma.userDefinedTable.create({ data: { organizationId: orgId, tableName: dto.tableName, description: dto.description, columns: (dto.columns || []) as any } });
  }

  async findAllUDTs(orgId: string) {
    return this.prisma.userDefinedTable.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async findUDT(orgId: string, id: string) {
    const table = await this.prisma.userDefinedTable.findFirst({ where: { id, organizationId: orgId } });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async addTableData(orgId: string, id: string, newRow: any) {
    const table = await this.findUDT(orgId, id);
    const currentData = (table.data as any[]) || [];
    currentData.push({ ...newRow, _id: `row-${Date.now()}`, _createdAt: new Date().toISOString() });
    return this.prisma.userDefinedTable.update({ where: { id }, data: { data: currentData as any } });
  }

  async createAuthGroup(orgId: string, dto: CreateAuthorizationGroupDto) {
    return this.prisma.authorizationGroup.create({ data: { organizationId: orgId, name: dto.name, description: dto.description, module: dto.module, permissions: (dto.permissions || {}) as any, dataOwnership: dto.dataOwnership as any } });
  }

  async findAllAuthGroups(orgId: string) {
    return this.prisma.authorizationGroup.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' } });
  }

  async updateAuthGroup(orgId: string, id: string, data: any) {
    return this.prisma.authorizationGroup.update({ where: { id }, data });
  }

  async createInventoryValuation(orgId: string, data: { itemCode: string; valuationMethod: string; standardCost?: number }) {
    return this.prisma.inventoryValuation.upsert({
      where: { organizationId_itemCode: { organizationId: orgId, itemCode: data.itemCode } },
      update: { valuationMethod: data.valuationMethod, standardCost: data.standardCost },
      create: { organizationId: orgId, itemCode: data.itemCode, valuationMethod: data.valuationMethod, standardCost: data.standardCost },
    });
  }

  async findInventoryValuations(orgId: string) {
    return this.prisma.inventoryValuation.findMany({ where: { organizationId: orgId }, orderBy: { itemCode: 'asc' } });
  }

  async getSummary(orgId: string) {
    const [udts, authGroups, valuations] = await Promise.all([
      this.prisma.userDefinedTable.count({ where: { organizationId: orgId } }),
      this.prisma.authorizationGroup.count({ where: { organizationId: orgId } }),
      this.prisma.inventoryValuation.count({ where: { organizationId: orgId } }),
    ]);
    return { userDefinedTables: udts, authorizationGroups: authGroups, inventoryValuations: valuations };
  }
}
