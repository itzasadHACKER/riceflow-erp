import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateWorkflowDefinitionDto,
  InitiateWorkflowDto,
  WorkflowActionDto,
  WorkflowActionEnum,
  WorkflowFilterDto,
} from './dto/workflow.dto';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async createDefinition(organizationId: string, dto: CreateWorkflowDefinitionDto) {
    const stepsJson = dto.steps.map((s) => ({
      name: s.name,
      stepNumber: s.stepNumber,
      approverRole: s.approverRole,
      approverId: s.approverId,
      condition: s.condition,
    }));
    return this.prisma.workflowDefinition.create({
      data: {
        organizationId,
        name: dto.name,
        entityType: dto.entityType,
        description: dto.description,
        steps: stepsJson as unknown as Prisma.InputJsonValue,
        autoEscalateHours: dto.autoEscalateHours,
      },
    });
  }

  async getDefinitions(organizationId: string, entityType?: string) {
    const where: Prisma.WorkflowDefinitionWhereInput = { organizationId, isActive: true };
    if (entityType) where.entityType = entityType;
    return this.prisma.workflowDefinition.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getDefinitionById(organizationId: string, id: string) {
    const def = await this.prisma.workflowDefinition.findFirst({
      where: { id, organizationId },
      include: { instances: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!def) throw new NotFoundException('Workflow definition not found');
    return def;
  }

  async initiateWorkflow(organizationId: string, dto: InitiateWorkflowDto, initiatedBy?: string) {
    const definition = await this.prisma.workflowDefinition.findFirst({
      where: { id: dto.workflowDefinitionId, organizationId, isActive: true },
    });
    if (!definition) throw new NotFoundException('Workflow definition not found');

    const steps = definition.steps as unknown as { stepNumber: number; name: string; approverId?: string }[];
    if (!steps || steps.length === 0) {
      throw new BadRequestException('Workflow has no steps defined');
    }

    return this.prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          organizationId,
          workflowDefinitionId: dto.workflowDefinitionId,
          entityType: dto.entityType,
          entityId: dto.entityId,
          currentStep: 0,
          status: 'PENDING',
          initiatedBy: initiatedBy ?? null,
        },
      });

      for (const step of steps) {
        await tx.workflowApproval.create({
          data: {
            organizationId,
            workflowInstanceId: instance.id,
            stepNumber: step.stepNumber,
            approverId: step.approverId ?? null,
            status: 'PENDING',
          },
        });
      }

      return instance;
    });
  }

  async processAction(organizationId: string, instanceId: string, dto: WorkflowActionDto, userId?: string) {
    const instance = await this.prisma.workflowInstance.findFirst({
      where: { id: instanceId, organizationId },
      include: { approvals: { orderBy: { stepNumber: 'asc' } }, workflowDefinition: true },
    });
    if (!instance) throw new NotFoundException('Workflow instance not found');
    if (instance.status === 'APPROVED' || instance.status === 'REJECTED') {
      throw new BadRequestException('Workflow already completed');
    }

    const currentApproval = instance.approvals.find((a) => a.stepNumber === instance.currentStep);
    if (!currentApproval) throw new BadRequestException('No pending approval at current step');

    return this.prisma.$transaction(async (tx) => {
      if (dto.action === WorkflowActionEnum.APPROVE) {
        await tx.workflowApproval.update({
          where: { id: currentApproval.id },
          data: { status: 'APPROVED', comments: dto.comments, actionDate: new Date(), approverId: userId },
        });

        const nextStep = instance.currentStep + 1;
        const totalSteps = instance.approvals.length;
        if (nextStep >= totalSteps) {
          return tx.workflowInstance.update({
            where: { id: instanceId },
            data: { status: 'APPROVED', currentStep: nextStep, completedAt: new Date() },
          });
        }
        return tx.workflowInstance.update({
          where: { id: instanceId },
          data: { status: 'IN_PROGRESS', currentStep: nextStep },
        });
      } else if (dto.action === WorkflowActionEnum.REJECT) {
        await tx.workflowApproval.update({
          where: { id: currentApproval.id },
          data: { status: 'REJECTED', comments: dto.comments, actionDate: new Date(), approverId: userId },
        });
        return tx.workflowInstance.update({
          where: { id: instanceId },
          data: { status: 'REJECTED', completedAt: new Date() },
        });
      } else if (dto.action === WorkflowActionEnum.DELEGATE) {
        if (!dto.delegateTo) throw new BadRequestException('delegateTo is required for delegation');
        await tx.workflowApproval.update({
          where: { id: currentApproval.id },
          data: { delegatedTo: dto.delegateTo, comments: dto.comments },
        });
        return tx.workflowInstance.findFirst({ where: { id: instanceId } });
      } else {
        await tx.workflowApproval.update({
          where: { id: currentApproval.id },
          data: { status: 'ESCALATED', comments: dto.comments, actionDate: new Date() },
        });
        return tx.workflowInstance.update({
          where: { id: instanceId },
          data: { status: 'ESCALATED' },
        });
      }
    });
  }

  async getInstances(organizationId: string, filter: WorkflowFilterDto) {
    const page = parseInt(filter.page ?? '1', 10);
    const limit = parseInt(filter.limit ?? '20', 10);
    const where: Prisma.WorkflowInstanceWhereInput = { organizationId };
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.status) where.status = filter.status as 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CANCELLED';
    const [data, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { workflowDefinition: true, approvals: true },
      }),
      this.prisma.workflowInstance.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getPendingApprovals(organizationId: string, userId: string) {
    return this.prisma.workflowApproval.findMany({
      where: {
        organizationId,
        status: 'PENDING',
        approverId: userId,
      },
      include: {
        workflowInstance: { include: { workflowDefinition: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
