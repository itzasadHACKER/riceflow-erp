import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, userId: string, dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: {
        organizationId,
        createdById: userId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority ?? 'MEDIUM',
        isPinned: dto.isPinned ?? false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        targetDepartments: dto.targetDepartments ?? [],
        targetRoles: dto.targetRoles ?? [],
        isPublished: true,
      },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async getAll(organizationId: string, page = 1, limit = 20) {
    const where = {
      organizationId,
      isPublished: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    };
    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);
    return { announcements, total, page, limit };
  }

  async getById(organizationId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, organizationId },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async acknowledge(organizationId: string, announcementId: string, userId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id: announcementId, organizationId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    return this.prisma.announcementAcknowledgment.upsert({
      where: { announcementId_userId: { announcementId, userId } },
      create: { announcementId, userId },
      update: { acknowledgedAt: new Date() },
    });
  }

  async pin(organizationId: string, id: string, isPinned: boolean) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, organizationId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.update({
      where: { id },
      data: { isPinned },
    });
  }

  async archive(organizationId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, organizationId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return this.prisma.announcement.update({
      where: { id },
      data: { isPublished: false },
    });
  }
}
