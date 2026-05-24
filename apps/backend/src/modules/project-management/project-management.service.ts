import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, CreateTimesheetDto, CreateMilestoneDto, CreateProjectExpenseDto } from './dto/project-management.dto';

@Injectable()
export class ProjectManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(orgId: string, dto: CreateProjectDto) {
    const count = await this.prisma.project.count({ where: { organizationId: orgId } });
    const projectCode = `PRJ-${String(count + 1).padStart(4, '0')}`;
    return this.prisma.project.create({
      data: { organizationId: orgId, projectCode, name: dto.name, description: dto.description, customerId: dto.customerId, managerId: dto.managerId, startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, budgetAmount: dto.budgetAmount ?? 0, costCenterId: dto.costCenterId },
      include: { tasks: true, milestones: true },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.project.findMany({ where: { organizationId: orgId }, include: { tasks: { select: { id: true, name: true, status: true } }, milestones: { select: { id: true, name: true, status: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(orgId: string, id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, organizationId: orgId }, include: { tasks: true, milestones: true, timesheets: true, projectExpenses: true } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(orgId: string, id: string, dto: UpdateProjectDto) {
    await this.findOne(orgId, id);
    const data: any = { ...dto };
    if (dto.status === 'IN_PROGRESS_PROJ' && !data.actualStart) data.actualStart = new Date();
    if (dto.status === 'COMPLETED_PROJ') data.actualEnd = new Date();
    return this.prisma.project.update({ where: { id }, data });
  }

  async createTask(orgId: string, dto: CreateTaskDto) {
    const count = await this.prisma.projectTask.count({ where: { projectId: dto.projectId } });
    const taskCode = `T-${String(count + 1).padStart(3, '0')}`;
    return this.prisma.projectTask.create({
      data: { projectId: dto.projectId, taskCode, name: dto.name, description: dto.description, parentTaskId: dto.parentTaskId, assignedToId: dto.assignedToId, priority: dto.priority || 'MEDIUM', startDate: dto.startDate ? new Date(dto.startDate) : undefined, endDate: dto.endDate ? new Date(dto.endDate) : undefined, estimatedHours: dto.estimatedHours, dependsOnTaskId: dto.dependsOnTaskId, sortOrder: count },
    });
  }

  async findTasks(projectId: string) {
    return this.prisma.projectTask.findMany({ where: { projectId }, orderBy: { sortOrder: 'asc' } });
  }

  async updateTask(id: string, data: Partial<CreateTaskDto> & { status?: string; completionPercent?: number; actualHours?: number }) {
    return this.prisma.projectTask.update({ where: { id }, data: data as any });
  }

  async createTimesheet(orgId: string, dto: CreateTimesheetDto) {
    return this.prisma.timesheet.create({ data: { organizationId: orgId, projectId: dto.projectId, taskId: dto.taskId, employeeId: dto.employeeId, date: new Date(dto.date), hours: dto.hours, description: dto.description, billable: dto.billable ?? true, hourlyRate: dto.hourlyRate } });
  }

  async findTimesheets(orgId: string, projectId?: string) {
    const where: any = { organizationId: orgId };
    if (projectId) where.projectId = projectId;
    return this.prisma.timesheet.findMany({ where, include: { project: { select: { id: true, name: true, projectCode: true } } }, orderBy: { date: 'desc' } });
  }

  async createMilestone(dto: CreateMilestoneDto) {
    return this.prisma.projectMilestone.create({ data: { projectId: dto.projectId, name: dto.name, description: dto.description, dueDate: new Date(dto.dueDate), billingAmount: dto.billingAmount } });
  }

  async findMilestones(projectId: string) {
    return this.prisma.projectMilestone.findMany({ where: { projectId }, orderBy: { dueDate: 'asc' } });
  }

  async completeMilestone(id: string) {
    return this.prisma.projectMilestone.update({ where: { id }, data: { status: 'COMPLETED', completedDate: new Date() } });
  }

  async createExpense(dto: CreateProjectExpenseDto) {
    return this.prisma.projectExpense.create({ data: { projectId: dto.projectId, description: dto.description, amount: dto.amount, date: new Date(dto.date), category: dto.category } });
  }

  async getSummary(orgId: string) {
    const [total, active, totalBudget] = await Promise.all([
      this.prisma.project.count({ where: { organizationId: orgId } }),
      this.prisma.project.count({ where: { organizationId: orgId, status: 'IN_PROGRESS_PROJ' } }),
      this.prisma.project.aggregate({ where: { organizationId: orgId }, _sum: { budgetAmount: true, actualCost: true } }),
    ]);
    return { totalProjects: total, activeProjects: active, totalBudget: totalBudget._sum.budgetAmount ?? 0, totalActualCost: totalBudget._sum.actualCost ?? 0 };
  }
}
