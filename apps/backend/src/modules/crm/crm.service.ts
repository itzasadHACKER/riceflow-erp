import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateLeadDto,
  UpdateLeadDto,
  CreateBrokerDto,
  UpdateBrokerDto,
  CreateCommunicationLogDto,
  CreateFollowUpDto,
} from './dto/crm.dto';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ===== LEADS =====

  async createLead(organizationId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        organizationId,
        name: dto.name,
        company: dto.company,
        phone: dto.phone,
        email: dto.email,
        source: dto.source ?? 'WALK_IN',
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
    });
  }

  async listLeads(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string,
  ) {
    const where: Prisma.LeadWhereInput = {
      organizationId,
      ...(status
        ? {
            status: status as
              | 'NEW'
              | 'CONTACTED'
              | 'QUALIFIED'
              | 'NEGOTIATION'
              | 'WON'
              | 'LOST',
          }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { company: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getLead(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateLead(organizationId: string, id: string, dto: UpdateLeadDto) {
    await this.getLead(organizationId, id);
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async convertLeadToCustomer(organizationId: string, leadId: string) {
    const lead = await this.getLead(organizationId, leadId);
    if (lead.status === 'WON') {
      throw new BadRequestException('Lead is already converted');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.lead.update({
        where: { id: leadId },
        data: { status: 'WON' },
      });

      const customer = await tx.customer.create({
        data: {
          organizationId,
          name: lead.name,
          company: lead.company,
          phone: lead.phone,
          email: lead.email,
        },
      });

      return { lead: { ...lead, status: 'WON' }, customer };
    });
  }

  async getLeadPipeline(organizationId: string) {
    const pipeline = await this.prisma.lead.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: true,
    });

    return pipeline.map((stage) => ({
      status: stage.status,
      count: stage._count,
    }));
  }

  // ===== BROKERS =====

  async createBroker(organizationId: string, dto: CreateBrokerDto) {
    return this.prisma.broker.create({
      data: {
        organizationId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        commissionRate: dto.commissionRate,
        address: dto.address,
      },
    });
  }

  async listBrokers(organizationId: string) {
    return this.prisma.broker.findMany({
      where: { organizationId, isActive: true },
      include: { _count: { select: { paddyPurchases: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getBroker(organizationId: string, id: string) {
    const broker = await this.prisma.broker.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { paddyPurchases: true } } },
    });
    if (!broker) throw new NotFoundException('Broker not found');
    return broker;
  }

  async updateBroker(organizationId: string, id: string, dto: UpdateBrokerDto) {
    await this.getBroker(organizationId, id);
    return this.prisma.broker.update({ where: { id }, data: dto });
  }

  // ===== COMMUNICATION LOGS =====

  async createCommunicationLog(
    organizationId: string,
    userId: string,
    dto: CreateCommunicationLogDto,
  ) {
    return this.prisma.communicationLog.create({
      data: {
        organizationId,
        contactType: dto.contactType,
        contactId: dto.contactId,
        channel: dto.channel,
        subject: dto.subject,
        content: dto.content,
        loggedBy: userId,
      },
      include: { followUps: true },
    });
  }

  async listCommunicationLogs(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    contactType?: string,
    contactId?: string,
  ) {
    const where: Prisma.CommunicationLogWhereInput = {
      organizationId,
      ...(contactType ? { contactType } : {}),
      ...(contactId ? { contactId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where,
        include: { followUps: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.communicationLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== FOLLOW-UPS =====

  async createFollowUp(dto: CreateFollowUpDto) {
    const log = await this.prisma.communicationLog.findFirst({
      where: { id: dto.communicationLogId },
    });
    if (!log) throw new NotFoundException('Communication log not found');

    return this.prisma.followUp.create({
      data: {
        communicationLogId: dto.communicationLogId,
        dueDate: new Date(dto.dueDate),
        assignedTo: dto.assignedTo,
        notes: dto.notes,
      },
    });
  }

  async completeFollowUp(id: string) {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id },
    });
    if (!followUp) throw new NotFoundException('Follow-up not found');

    return this.prisma.followUp.update({
      where: { id },
      data: { status: 'DONE' },
    });
  }

  async getPendingFollowUps(organizationId: string) {
    return this.prisma.followUp.findMany({
      where: {
        communicationLog: { organizationId },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      include: { communicationLog: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  // ============================================================================
  // MEETINGS
  // ============================================================================

  async createMeeting(
    organizationId: string,
    data: {
      title: string;
      scheduledAt: string;
      duration?: number;
      location?: string;
      meetingType: string;
      entityType?: string;
      entityId?: string;
      agenda?: string;
      attendees?: string[];
    },
    createdBy?: string,
  ) {
    return this.prisma.meeting.create({
      data: {
        organizationId,
        title: data.title,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        location: data.location,
        meetingType: data.meetingType,
        entityType: data.entityType,
        entityId: data.entityId,
        agenda: data.agenda,
        attendees: (data.attendees ?? []) as Prisma.InputJsonValue,
        organizedBy: createdBy,
      },
    });
  }

  async getMeetings(organizationId: string, startDate?: string, endDate?: string) {
    const where: Prisma.MeetingWhereInput = { organizationId };
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate);
      if (endDate) where.scheduledAt.lte = new Date(endDate);
    }
    return this.prisma.meeting.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async completeMeeting(organizationId: string, meetingId: string, minutes: string) {
    return this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED', minutes },
    });
  }
}
