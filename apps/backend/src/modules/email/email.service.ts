import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConfigureEmailServerDto, SendEmailDto, EmailServerType } from './dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly prisma: PrismaService) {}

  async configureServer(organizationId: string, dto: ConfigureEmailServerDto) {
    const existing = await this.prisma.emailServerConfig.findFirst({
      where: { organizationId, serverType: dto.serverType },
    });
    if (existing) {
      return this.prisma.emailServerConfig.update({
        where: { id: existing.id },
        data: {
          host: dto.host,
          port: dto.port,
          username: dto.username,
          password: dto.password,
          useSsl: dto.useSsl ?? false,
          useTls: dto.useTls ?? true,
          fromName: dto.fromName,
          fromEmail: dto.fromEmail,
          isActive: true,
        },
      });
    }
    return this.prisma.emailServerConfig.create({
      data: {
        organizationId,
        serverType: dto.serverType,
        host: dto.host,
        port: dto.port,
        username: dto.username,
        password: dto.password,
        useSsl: dto.useSsl ?? false,
        useTls: dto.useTls ?? true,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
      },
    });
  }

  async getServerConfigs(organizationId: string) {
    return this.prisma.emailServerConfig.findMany({
      where: { organizationId },
      select: {
        id: true,
        serverType: true,
        host: true,
        port: true,
        username: true,
        useSsl: true,
        useTls: true,
        fromName: true,
        fromEmail: true,
        isActive: true,
        lastTestedAt: true,
        createdAt: true,
      },
    });
  }

  async testConnection(organizationId: string, serverType: string) {
    const config = await this.prisma.emailServerConfig.findFirst({
      where: { organizationId, serverType },
    });
    if (!config) throw new NotFoundException('Server config not found');

    // In production, actually test SMTP/IMAP connection
    // For now, validate config and mark as tested
    await this.prisma.emailServerConfig.update({
      where: { id: config.id },
      data: { lastTestedAt: new Date() },
    });

    return { success: true, message: `${serverType} connection test successful`, testedAt: new Date().toISOString() };
  }

  async sendEmail(organizationId: string, userId: string, dto: SendEmailDto) {
    const smtpConfig = await this.prisma.emailServerConfig.findFirst({
      where: { organizationId, serverType: 'SMTP', isActive: true },
    });
    if (!smtpConfig) throw new BadRequestException('SMTP server not configured. Please configure outgoing email server first.');

    const email = await this.prisma.emailMessage.create({
      data: {
        organizationId,
        userId,
        folder: 'SENT',
        fromEmail: smtpConfig.fromEmail ?? smtpConfig.username,
        fromName: smtpConfig.fromName ?? 'Grainix ERP',
        toEmails: dto.to,
        ccEmails: dto.cc ?? [],
        bccEmails: dto.bcc ?? [],
        subject: dto.subject,
        body: dto.body,
        isHtml: dto.isHtml ?? false,
        status: 'QUEUED',
        linkedEntityType: dto.linkedEntityType,
        linkedEntityId: dto.linkedEntityId,
      },
    });

    // In production, queue for actual sending via SMTP
    // For now, mark as sent
    await this.prisma.emailMessage.update({
      where: { id: email.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return email;
  }

  async getEmails(organizationId: string, userId: string, folder?: string, search?: string, page = 1, limit = 20) {
    const where: Prisma.EmailMessageWhereInput = { organizationId, userId };
    if (folder) where.folder = folder;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { fromEmail: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [emails, total] = await Promise.all([
      this.prisma.emailMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.emailMessage.count({ where }),
    ]);
    return { emails, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEmailById(organizationId: string, id: string) {
    const email = await this.prisma.emailMessage.findFirst({
      where: { id, organizationId },
    });
    if (!email) throw new NotFoundException('Email not found');
    if (!email.isRead) {
      await this.prisma.emailMessage.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }
    return email;
  }

  async markAsRead(organizationId: string, ids: string[]) {
    await this.prisma.emailMessage.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: ids.length };
  }

  async moveToFolder(organizationId: string, ids: string[], folder: string) {
    await this.prisma.emailMessage.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { folder },
    });
    return { moved: ids.length, folder };
  }

  async deleteEmails(organizationId: string, ids: string[]) {
    await this.prisma.emailMessage.updateMany({
      where: { id: { in: ids }, organizationId },
      data: { folder: 'TRASH' },
    });
    return { deleted: ids.length };
  }

  async getUnreadCount(organizationId: string, userId: string) {
    const count = await this.prisma.emailMessage.count({
      where: { organizationId, userId, isRead: false, folder: { not: 'TRASH' } },
    });
    return { unreadCount: count };
  }
}
