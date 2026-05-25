import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProductCategoryDto, SetParameterValueDto } from './dto/product-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateProductCategoryDto) {
    return this.prisma.productCategory.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        module: dto.module,
        parentId: dto.parentId,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        parameters: dto.parameters
          ? {
              create: dto.parameters.map((p, i) => ({
                name: p.name,
                fieldType: p.fieldType ?? 'TEXT',
                options: p.options != null ? (p.options as Prisma.InputJsonValue) : Prisma.JsonNull,
                isRequired: p.isRequired ?? false,
                sortOrder: p.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { parameters: true, children: true },
    });
  }

  async findAll(organizationId: string, module?: string) {
    const where: Record<string, unknown> = { organizationId, isActive: true };
    if (module) where.module = module;

    return this.prisma.productCategory.findMany({
      where,
      include: { parameters: true, children: { include: { parameters: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const cat = await this.prisma.productCategory.findFirst({
      where: { id, organizationId },
      include: { parameters: true, children: { include: { parameters: true } }, parent: true },
    });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async getTree(organizationId: string, module: string) {
    const categories = await this.prisma.productCategory.findMany({
      where: { organizationId, module, parentId: null, isActive: true },
      include: {
        parameters: true,
        children: {
          include: { parameters: true, children: { include: { parameters: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories;
  }

  async setParameterValue(organizationId: string, dto: SetParameterValueDto) {
    const existing = await this.prisma.categoryParameterValue.findFirst({
      where: { organizationId, parameterId: dto.parameterId, entityId: dto.entityId, entityType: dto.entityType },
    });
    if (existing) {
      return this.prisma.categoryParameterValue.update({
        where: { id: existing.id },
        data: { value: dto.value },
      });
    }
    return this.prisma.categoryParameterValue.create({
      data: { organizationId, ...dto },
    });
  }

  async getParameterValues(organizationId: string, entityType: string, entityId: string) {
    return this.prisma.categoryParameterValue.findMany({
      where: { organizationId, entityType, entityId },
    });
  }

  async delete(organizationId: string, id: string) {
    const cat = await this.findOne(organizationId, id);
    await this.prisma.productCategory.update({ where: { id: cat.id }, data: { isActive: false } });
    return { message: 'Category deactivated' };
  }
}
