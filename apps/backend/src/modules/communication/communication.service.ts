import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateConversationDto, SendMessageDto, CreateContactGroupDto } from './dto/communication.dto';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(organizationId: string, userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        organizationId,
        subject: dto.subject,
        channel: dto.channel,
        createdById: userId,
        linkedEntityType: dto.linkedEntityType,
        linkedEntityId: dto.linkedEntityId,
        participants: {
          create: [
            { userId, role: 'OWNER' },
            ...dto.participantIds.map((pid) => ({ userId: pid, role: 'PARTICIPANT' as const })),
          ],
        },
      },
      include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
    });
  }

  async getConversations(organizationId: string, userId: string, channel?: string, search?: string, page = 1, limit = 20) {
    const where: Prisma.ConversationWhereInput = {
      organizationId,
      participants: { some: { userId } },
    };
    if (channel) where.channel = channel;
    if (search) where.subject = { contains: search, mode: 'insensitive' };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);
    return { conversations, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getConversation(organizationId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  async sendMessage(organizationId: string, conversationId: string, userId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, organizationId },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderId: userId,
        content: dto.content,
        isHtml: dto.isHtml ?? false,
        attachments: dto.attachmentUrls ?? [],
      },
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async createContactGroup(organizationId: string, userId: string, dto: CreateContactGroupDto) {
    return this.prisma.contactGroup.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        createdById: userId,
        contacts: dto.contactIds,
      },
    });
  }

  async getContactGroups(organizationId: string) {
    return this.prisma.contactGroup.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async getIntegrationGuide(integrationType: string) {
    const guides: Record<string, object> = {
      whatsapp: {
        title: 'WhatsApp Business API Integration',
        steps: [
          'Create a Meta Business Account at business.facebook.com',
          'Go to Meta for Developers and create a new App',
          'Add WhatsApp product to your App',
          'Set up a phone number for WhatsApp Business',
          'Generate a permanent access token',
          'Configure webhook URL in Grainix ERP Settings → Integrations',
          'Enter your WhatsApp Business Account ID and Access Token',
          'Test by sending a message from Grainix ERP',
        ],
        requiredFields: ['businessAccountId', 'accessToken', 'phoneNumberId', 'webhookVerifyToken'],
        documentation: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
      },
      gmail: {
        title: 'Gmail / Google Workspace Integration',
        steps: [
          'Go to Google Cloud Console (console.cloud.google.com)',
          'Create a new project or select existing',
          'Enable Gmail API from the API Library',
          'Create OAuth 2.0 credentials (Web Application type)',
          'Add Grainix ERP redirect URI to authorized redirects',
          'Copy Client ID and Client Secret to Grainix ERP Email Settings',
          'Or use App Password: Go to Google Account → Security → 2FA → App Passwords',
          'Configure SMTP: smtp.gmail.com, Port 587, TLS enabled',
          'Configure IMAP: imap.gmail.com, Port 993, SSL enabled',
        ],
        smtpConfig: { host: 'smtp.gmail.com', port: 587, useTls: true },
        imapConfig: { host: 'imap.gmail.com', port: 993, useSsl: true },
        documentation: 'https://developers.google.com/gmail/api',
      },
      outlook: {
        title: 'Microsoft Outlook / Office 365 Integration',
        steps: [
          'Go to Azure Portal (portal.azure.com)',
          'Register a new App in Azure Active Directory',
          'Add Mail.Send and Mail.Read API permissions',
          'Create a client secret',
          'Configure SMTP: smtp.office365.com, Port 587, TLS',
          'Configure IMAP: outlook.office365.com, Port 993, SSL',
          'Enter credentials in Grainix ERP Email Settings',
        ],
        smtpConfig: { host: 'smtp.office365.com', port: 587, useTls: true },
        imapConfig: { host: 'outlook.office365.com', port: 993, useSsl: true },
        documentation: 'https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth',
      },
    };
    return guides[integrationType] ?? { error: 'Unknown integration type. Available: whatsapp, gmail, outlook' };
  }
}
