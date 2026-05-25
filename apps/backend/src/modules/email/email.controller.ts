import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { createResponse, createPaginatedResponse } from '../../common/interfaces/api-response.interface';
import { EmailService } from './email.service';
import { ConfigureEmailServerDto, SendEmailDto } from './dto/email.dto';

@ApiTags('Email System')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('servers/configure')
  @ApiOperation({ summary: 'Configure email server (SMTP/IMAP)' })
  async configureServer(@CurrentUser() user: JwtPayload, @Body() dto: ConfigureEmailServerDto) {
    const result = await this.emailService.configureServer(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('servers')
  @ApiOperation({ summary: 'Get email server configurations' })
  async getServers(@CurrentUser() user: JwtPayload) {
    const result = await this.emailService.getServerConfigs(user.organizationId);
    return createResponse(result);
  }

  @Post('servers/test/:serverType')
  @ApiOperation({ summary: 'Test email server connection' })
  async testConnection(@CurrentUser() user: JwtPayload, @Param('serverType') serverType: string) {
    const result = await this.emailService.testConnection(user.organizationId, serverType);
    return createResponse(result);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  async sendEmail(@CurrentUser() user: JwtPayload, @Body() dto: SendEmailDto) {
    const result = await this.emailService.sendEmail(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Get('messages')
  @ApiOperation({ summary: 'List emails with filters' })
  async getEmails(
    @CurrentUser() user: JwtPayload,
    @Query('folder') folder?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.emailService.getEmails(
      user.organizationId, user.sub, folder, search,
      page ? parseInt(page) : 1, limit ? parseInt(limit) : 20,
    );
    return createPaginatedResponse(result.emails, result.total, result.page, result.limit);
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get email details' })
  async getEmail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.emailService.getEmailById(user.organizationId, id);
    return createResponse(result);
  }

  @Put('messages/read')
  @ApiOperation({ summary: 'Mark emails as read' })
  async markAsRead(@CurrentUser() user: JwtPayload, @Body('ids') ids: string[]) {
    const result = await this.emailService.markAsRead(user.organizationId, ids);
    return createResponse(result);
  }

  @Put('messages/move')
  @ApiOperation({ summary: 'Move emails to folder' })
  async moveToFolder(@CurrentUser() user: JwtPayload, @Body('ids') ids: string[], @Body('folder') folder: string) {
    const result = await this.emailService.moveToFolder(user.organizationId, ids, folder);
    return createResponse(result);
  }

  @Delete('messages')
  @ApiOperation({ summary: 'Delete emails (move to trash)' })
  async deleteEmails(@CurrentUser() user: JwtPayload, @Body('ids') ids: string[]) {
    const result = await this.emailService.deleteEmails(user.organizationId, ids);
    return createResponse(result);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread email count' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const result = await this.emailService.getUnreadCount(user.organizationId, user.sub);
    return createResponse(result);
  }
}
