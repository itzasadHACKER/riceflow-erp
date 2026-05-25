import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        branches: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
        _count: {
          select: {
            users: true,
            employees: true,
            branches: true,
            departments: true,
          },
        },
      },
    });

    if (!org || org.deletedAt) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.findById(id);

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  async getDashboardStats(organizationId: string) {
    const [
      usersCount,
      employeesCount,
      branchesCount,
      suppliersCount,
      customersCount,
      warehousesCount,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.employee.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.branch.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.supplier.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.customer.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
      this.prisma.warehouse.count({
        where: { organizationId, isActive: true, deletedAt: null },
      }),
    ]);

    return {
      users: usersCount,
      employees: employeesCount,
      branches: branchesCount,
      suppliers: suppliersCount,
      customers: customersCount,
      warehouses: warehousesCount,
    };
  }
}
