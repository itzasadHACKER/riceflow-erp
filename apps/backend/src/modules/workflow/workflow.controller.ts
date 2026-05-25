import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse, createPaginatedResponse } from '../../common/interfaces/api-response.interface';
import { WorkflowService } from './workflow.service';
import {
  CreateWorkflowDefinitionDto,
  InitiateWorkflowDto,
  WorkflowActionDto,
  WorkflowFilterDto,
} from './dto/workflow.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('definitions')
  @ApiOperation({ summary: 'Create workflow definition' })
  async createDefinition(@CurrentUser() user: JwtPayload, @Body() dto: CreateWorkflowDefinitionDto) {
    const result = await this.workflowService.createDefinition(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('definitions')
  @ApiOperation({ summary: 'List workflow definitions' })
  async getDefinitions(@CurrentUser() user: JwtPayload, @Query('entityType') entityType?: string) {
    const result = await this.workflowService.getDefinitions(user.organizationId, entityType);
    return createResponse(result);
  }

  @Get('definitions/:id')
  @ApiOperation({ summary: 'Get workflow definition by ID' })
  async getDefinitionById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.workflowService.getDefinitionById(user.organizationId, id);
    return createResponse(result);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate a workflow' })
  async initiateWorkflow(@CurrentUser() user: JwtPayload, @Body() dto: InitiateWorkflowDto) {
    const result = await this.workflowService.initiateWorkflow(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Post('instances/:id/action')
  @ApiOperation({ summary: 'Process workflow action (approve/reject/delegate/escalate)' })
  async processAction(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: WorkflowActionDto,
  ) {
    const result = await this.workflowService.processAction(user.organizationId, id, dto, user.sub);
    return createResponse(result);
  }

  @Get('instances')
  @ApiOperation({ summary: 'List workflow instances' })
  async getInstances(@CurrentUser() user: JwtPayload, @Query() filter: WorkflowFilterDto) {
    const result = await this.workflowService.getInstances(user.organizationId, filter);
    return createPaginatedResponse(result.data, result.total, result.page, result.limit);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  async getPendingApprovals(@CurrentUser() user: JwtPayload) {
    const result = await this.workflowService.getPendingApprovals(user.organizationId, user.sub);
    return createResponse(result);
  }
}
