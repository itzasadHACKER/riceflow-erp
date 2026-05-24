import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { UpsertSettingDto, CreateNotificationDto } from './dto/settings.dto';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ===== SYSTEM SETTINGS =====

  @Post('system')
  @ApiOperation({ summary: 'Create or update system setting' })
  async upsertSetting(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertSettingDto,
  ) {
    const setting = await this.settingsService.upsertSetting(
      user.organizationId,
      dto,
    );
    return createResponse(setting);
  }

  @Get('system')
  @ApiOperation({ summary: 'List system settings' })
  @ApiQuery({ name: 'category', required: false })
  async listSettings(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
  ) {
    const data = await this.settingsService.listSettings(
      user.organizationId,
      category,
    );
    return createResponse(data);
  }

  @Get('system/:key')
  @ApiOperation({ summary: 'Get system setting by key' })
  async getSetting(@CurrentUser() user: JwtPayload, @Param('key') key: string) {
    const setting = await this.settingsService.getSetting(
      user.organizationId,
      key,
    );
    return createResponse(setting);
  }

  @Delete('system/:key')
  @ApiOperation({ summary: 'Delete system setting' })
  async deleteSetting(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
  ) {
    await this.settingsService.deleteSetting(user.organizationId, key);
    return createResponse({ deleted: true });
  }

  @Post('system/seed')
  @ApiOperation({ summary: 'Seed default system settings' })
  async seedDefaults(@CurrentUser() user: JwtPayload) {
    const results = await this.settingsService.seedDefaultSettings(
      user.organizationId,
    );
    return createResponse(results);
  }

  // ===== NOTIFICATIONS =====

  @Post('notifications')
  @ApiOperation({ summary: 'Create notification' })
  async createNotification(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateNotificationDto,
  ) {
    const notification = await this.settingsService.createNotification(
      user.organizationId,
      dto,
    );
    return createResponse(notification);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'List notifications for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'unreadOnly', required: false })
  async listNotifications(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const result = await this.settingsService.listNotifications(
      user.organizationId,
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      unreadOnly === 'true',
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Post('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const notification = await this.settingsService.markNotificationRead(
      user.sub,
      id,
    );
    return createResponse(notification);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentUser() user: JwtPayload) {
    const result = await this.settingsService.markAllNotificationsRead(
      user.sub,
    );
    return createResponse({ markedRead: result.count });
  }

  // ===== AUDIT LOGS =====

  @Get('audit-logs')
  @ApiOperation({ summary: 'List audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  async listAuditLogs(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
  ) {
    const result = await this.settingsService.listAuditLogs(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      entityType,
      entityId,
      userId,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== FILE ATTACHMENTS =====

  @Get('attachments/:entityType/:entityId')
  @ApiOperation({ summary: 'List file attachments for an entity' })
  async listAttachments(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    const data = await this.settingsService.listFileAttachments(
      user.organizationId,
      entityType,
      entityId,
    );
    return createResponse(data);
  }

  @Post('custom-fields')
  @ApiOperation({ summary: 'Create custom field' })
  async createCustomField(@CurrentUser() user: JwtPayload, @Body() dto: Record<string, unknown>) {
    const result = await this.settingsService.createCustomField(
      user.organizationId,
      dto as Parameters<typeof this.settingsService.createCustomField>[1],
    );
    return createResponse(result);
  }

  @Get('custom-fields')
  @ApiOperation({ summary: 'List custom fields' })
  async getCustomFields(@CurrentUser() user: JwtPayload, @Query('entityType') entityType?: string) {
    const result = await this.settingsService.getCustomFields(user.organizationId, entityType);
    return createResponse(result);
  }

  @Post('custom-field-values')
  @ApiOperation({ summary: 'Set custom field value' })
  async setCustomFieldValue(@CurrentUser() user: JwtPayload, @Body() dto: { customFieldId: string; entityType: string; entityId: string; value: string }) {
    const result = await this.settingsService.setCustomFieldValue(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('custom-field-values')
  @ApiOperation({ summary: 'Get custom field values for entity' })
  async getCustomFieldValues(@CurrentUser() user: JwtPayload, @Query('entityId') entityId: string) {
    const result = await this.settingsService.getCustomFieldValues(user.organizationId, entityId);
    return createResponse(result);
  }
}
