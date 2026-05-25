import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateIntegrationConfigDto,
  AiChatDto,
  CreateScheduledJobDto,
  SendNotificationDto,
} from './dto/integration.dto';

@Injectable()
export class IntegrationService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Integration Configs ---
  async createConfig(organizationId: string, dto: CreateIntegrationConfigDto) {
    return this.prisma.integrationConfig.create({
      data: {
        organizationId,
        provider: dto.provider,
        integrationType: dto.integrationType,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
        isActive: dto.isActive ?? false,
      },
    });
  }

  async getConfigs(organizationId: string) {
    return this.prisma.integrationConfig.findMany({ where: { organizationId }, orderBy: { provider: 'asc' } });
  }

  async toggleConfig(organizationId: string, id: string, isActive: boolean) {
    const config = await this.prisma.integrationConfig.findFirst({ where: { id, organizationId } });
    if (!config) throw new NotFoundException('Integration config not found');
    return this.prisma.integrationConfig.update({ where: { id }, data: { isActive } });
  }

  async getAvailableIntegrations() {
    return [
      { provider: 'WHATSAPP', type: 'MESSAGING', description: 'WhatsApp Business API', status: 'AVAILABLE' },
      { provider: 'SMS', type: 'MESSAGING', description: 'SMS Gateway (Twilio/MessageBird)', status: 'AVAILABLE' },
      { provider: 'EMAIL', type: 'MESSAGING', description: 'Email (SMTP/SendGrid)', status: 'AVAILABLE' },
      { provider: 'PAYMENT_GATEWAY', type: 'PAYMENTS', description: 'Payment Gateway (Stripe/JazzCash)', status: 'AVAILABLE' },
      { provider: 'BANKING_API', type: 'BANKING', description: 'Banking API Integration', status: 'AVAILABLE' },
      { provider: 'WEIGHBRIDGE', type: 'IOT', description: 'Digital Weighbridge', status: 'AVAILABLE' },
      { provider: 'BIOMETRIC', type: 'IOT', description: 'Biometric Attendance System', status: 'AVAILABLE' },
      { provider: 'GPS', type: 'TRACKING', description: 'GPS Vehicle Tracking', status: 'AVAILABLE' },
      { provider: 'TAX_API', type: 'GOVERNMENT', description: 'FBR Tax API (Pakistan)', status: 'AVAILABLE' },
      { provider: 'OCR', type: 'AI', description: 'OCR Invoice Reader', status: 'AVAILABLE' },
    ];
  }

  // --- AI Assistant (Stub) ---
  async chat(organizationId: string, userId: string, dto: AiChatDto) {
    let conversationId = dto.conversationId;

    if (!conversationId) {
      const conversation = await this.prisma.aiConversation.create({
        data: {
          organizationId,
          userId,
          title: dto.message.substring(0, 50),
          messages: [{ role: 'user', content: dto.message, timestamp: new Date().toISOString() }] as Prisma.InputJsonValue,
          context: (dto.context ?? {}) as Prisma.InputJsonValue,
        },
      });
      conversationId = conversation.id;
    } else {
      const conversation = await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, organizationId },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
      const messages = conversation.messages as unknown as { role: string; content: string; timestamp: string }[];
      messages.push({ role: 'user', content: dto.message, timestamp: new Date().toISOString() });
      await this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messages: messages as unknown as Prisma.InputJsonValue },
      });
    }

    const aiResponse = `AI Assistant: I understand your query about "${dto.message}". ` +
      'This is a placeholder response. When the AI service is configured, I will provide ' +
      'intelligent insights based on your ERP data including procurement trends, sales forecasts, ' +
      'inventory optimization suggestions, and financial analytics.';

    const conversation = await this.prisma.aiConversation.findFirst({ where: { id: conversationId } });
    if (conversation) {
      const messages = conversation.messages as unknown as { role: string; content: string; timestamp: string }[];
      messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });
      await this.prisma.aiConversation.update({
        where: { id: conversationId },
        data: { messages: messages as unknown as Prisma.InputJsonValue },
      });
    }

    return { conversationId, response: aiResponse };
  }

  async getConversations(organizationId: string, userId: string) {
    return this.prisma.aiConversation.findMany({
      where: { organizationId, userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async getConversation(organizationId: string, id: string) {
    const conv = await this.prisma.aiConversation.findFirst({ where: { id, organizationId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  // --- Notifications (Stub) ---
  async sendNotification(organizationId: string, userId: string, dto: SendNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId,
        title: dto.subject,
        message: dto.body,
        type: dto.channel.toUpperCase(),
        isRead: false,
      },
    });
    return {
      notification,
      deliveryStatus: 'QUEUED',
      channel: dto.channel,
      message: `Notification queued for ${dto.channel} delivery. Configure ${dto.channel} integration to enable actual delivery.`,
    };
  }

  // --- Scheduled Jobs ---
  async createJob(organizationId: string, dto: CreateScheduledJobDto) {
    return this.prisma.scheduledJob.create({
      data: {
        organizationId,
        name: dto.name,
        jobType: dto.jobType,
        schedule: dto.schedule,
        config: (dto.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async getJobs(organizationId: string) {
    return this.prisma.scheduledJob.findMany({ where: { organizationId }, orderBy: { name: 'asc' } });
  }

  async toggleJob(organizationId: string, id: string, isActive: boolean) {
    const job = await this.prisma.scheduledJob.findFirst({ where: { id, organizationId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.prisma.scheduledJob.update({ where: { id }, data: { isActive } });
  }
}
