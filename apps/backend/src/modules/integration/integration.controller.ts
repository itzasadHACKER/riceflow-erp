import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { IntegrationService } from './integration.service';
import {
  CreateIntegrationConfigDto,
  AiChatDto,
  CreateScheduledJobDto,
  SendNotificationDto,
} from './dto/integration.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Integrations & AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  // --- Integration Configs ---
  @Post('configs')
  @ApiOperation({ summary: 'Create integration config' })
  async createConfig(@CurrentUser() user: JwtPayload, @Body() dto: CreateIntegrationConfigDto) {
    const result = await this.integrationService.createConfig(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('configs')
  @ApiOperation({ summary: 'List integration configs' })
  async getConfigs(@CurrentUser() user: JwtPayload) {
    const result = await this.integrationService.getConfigs(user.organizationId);
    return createResponse(result);
  }

  @Put('configs/:id/toggle')
  @ApiOperation({ summary: 'Enable/disable integration' })
  async toggleConfig(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const result = await this.integrationService.toggleConfig(user.organizationId, id, isActive);
    return createResponse(result);
  }

  @Get('available')
  @ApiOperation({ summary: 'List available integrations' })
  async getAvailable() {
    const result = await this.integrationService.getAvailableIntegrations();
    return createResponse(result);
  }

  // --- AI Assistant ---
  @Post('ai/chat')
  @ApiOperation({ summary: 'Chat with AI assistant' })
  async chat(@CurrentUser() user: JwtPayload, @Body() dto: AiChatDto) {
    const result = await this.integrationService.chat(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Get('ai/conversations')
  @ApiOperation({ summary: 'List AI conversations' })
  async getConversations(@CurrentUser() user: JwtPayload) {
    const result = await this.integrationService.getConversations(user.organizationId, user.sub);
    return createResponse(result);
  }

  @Get('ai/conversations/:id')
  @ApiOperation({ summary: 'Get AI conversation' })
  async getConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.integrationService.getConversation(user.organizationId, id);
    return createResponse(result);
  }

  // --- Notifications ---
  @Post('notifications/send')
  @ApiOperation({ summary: 'Send notification' })
  async sendNotification(@CurrentUser() user: JwtPayload, @Body() dto: SendNotificationDto) {
    const result = await this.integrationService.sendNotification(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  // --- Scheduled Jobs ---
  @Post('jobs')
  @ApiOperation({ summary: 'Create scheduled job' })
  async createJob(@CurrentUser() user: JwtPayload, @Body() dto: CreateScheduledJobDto) {
    const result = await this.integrationService.createJob(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List scheduled jobs' })
  async getJobs(@CurrentUser() user: JwtPayload) {
    const result = await this.integrationService.getJobs(user.organizationId);
    return createResponse(result);
  }

  @Put('jobs/:id/toggle')
  @ApiOperation({ summary: 'Enable/disable job' })
  async toggleJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const result = await this.integrationService.toggleJob(user.organizationId, id, isActive);
    return createResponse(result);
  }
}
