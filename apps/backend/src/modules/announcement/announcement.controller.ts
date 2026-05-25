import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { createResponse, createPaginatedResponse } from '../../common/interfaces/api-response.interface';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/announcement.dto';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @ApiOperation({ summary: 'Create announcement' })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAnnouncementDto) {
    const result = await this.announcementService.create(user.organizationId, user.sub, dto);
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List announcements' })
  async getAll(@CurrentUser() user: JwtPayload, @Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.announcementService.getAll(
      user.organizationId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20,
    );
    return createPaginatedResponse(result.announcements, result.total, result.page, result.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement' })
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.announcementService.getById(user.organizationId, id);
    return createResponse(result);
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge announcement' })
  async acknowledge(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.announcementService.acknowledge(user.organizationId, id, user.sub);
    return createResponse(result);
  }

  @Put(':id/pin')
  @ApiOperation({ summary: 'Pin/unpin announcement' })
  async pin(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('isPinned') isPinned: boolean) {
    const result = await this.announcementService.pin(user.organizationId, id, isPinned);
    return createResponse(result);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive announcement' })
  async archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.announcementService.archive(user.organizationId, id);
    return createResponse(result);
  }
}
