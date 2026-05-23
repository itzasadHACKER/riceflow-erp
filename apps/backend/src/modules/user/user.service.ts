import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (dto.roleId) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: dto.roleId,
          branchId: dto.branchId,
        },
      });
    }

    return user;
  }

  async findAll(organizationId: string, query: PaginationDto) {
    const { page = 1, limit = 20, search, sortBy, sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          isSuperAdmin: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: {
            include: {
              role: { select: { id: true, name: true, slug: true } },
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async findById(organizationId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: true,
            branch: true,
          },
        },
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async toggleActive(organizationId: string, id: string) {
    const user = await this.findById(organizationId, id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });
  }
}
