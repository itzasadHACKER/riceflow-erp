import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ProjectManagementService } from './project-management.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, CreateTimesheetDto, CreateMilestoneDto, CreateProjectExpenseDto } from './dto/project-management.dto';

@ApiTags('Project Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectManagementController {
  constructor(private readonly service: ProjectManagementService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProjectDto) { return this.service.createProject(user.organizationId, dto); }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAll(user.organizationId); }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findOne(user.organizationId, id); }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateProjectDto) { return this.service.updateProject(user.organizationId, id, dto); }

  @Post('tasks')
  createTask(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaskDto) { return this.service.createTask(user.organizationId, dto); }

  @Get(':id/tasks')
  findTasks(@Param('id') id: string) { return this.service.findTasks(id); }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() data: any) { return this.service.updateTask(id, data); }

  @Post('timesheets')
  createTimesheet(@CurrentUser() user: JwtPayload, @Body() dto: CreateTimesheetDto) { return this.service.createTimesheet(user.organizationId, dto); }

  @Get('timesheets/all')
  findTimesheets(@CurrentUser() user: JwtPayload, @Query('projectId') projectId?: string) { return this.service.findTimesheets(user.organizationId, projectId); }

  @Post('milestones')
  createMilestone(@Body() dto: CreateMilestoneDto) { return this.service.createMilestone(dto); }

  @Get(':id/milestones')
  findMilestones(@Param('id') id: string) { return this.service.findMilestones(id); }

  @Patch('milestones/:id/complete')
  completeMilestone(@Param('id') id: string) { return this.service.completeMilestone(id); }

  @Post('expenses')
  createExpense(@Body() dto: CreateProjectExpenseDto) { return this.service.createExpense(dto); }
}
