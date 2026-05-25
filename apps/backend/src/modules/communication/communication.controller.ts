import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { createResponse, createPaginatedResponse } from '../../common/interfaces/api-response.interface';
import { CommunicationService } from './communication.service';
import { CreateConversationDto, SendMessageDto, CreateContactGroupDto } from './dto/communication.dto';

@ApiTags('Communication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a conversation' })
  async createConversation(@CurrentUser() user: JwtPayload, @Body() dto: CreateConversationDto) {
    const result = await this.communicationService.createConversation(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  async getConversations(
    @CurrentUser() user: JwtPayload,
    @Query('channel') channel?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.communicationService.getConversations(
      user.organizationId, user.sub, channel, search,
      page ? parseInt(page) : 1, limit ? parseInt(limit) : 20,
    );
    return createPaginatedResponse(result.conversations, result.total, result.page, result.limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  async getConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.communicationService.getConversation(user.organizationId, id);
    return createResponse(result);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message in conversation' })
  async sendMessage(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: SendMessageDto) {
    const result = await this.communicationService.sendMessage(user.organizationId, id, user.sub, dto);
    return createResponse(result);
  }

  @Post('contact-groups')
  @ApiOperation({ summary: 'Create contact group' })
  async createContactGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateContactGroupDto) {
    const result = await this.communicationService.createContactGroup(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Get('contact-groups')
  @ApiOperation({ summary: 'List contact groups' })
  async getContactGroups(@CurrentUser() user: JwtPayload) {
    const result = await this.communicationService.getContactGroups(user.organizationId);
    return createResponse(result);
  }

  @Get('integration-guide/:type')
  @ApiOperation({ summary: 'Get integration guide (whatsapp/gmail/outlook)' })
  async getIntegrationGuide(@Param('type') type: string) {
    const result = await this.communicationService.getIntegrationGuide(type);
    return createResponse(result);
  }
}
