import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { MarketingCampaignService } from './marketing-campaign.service';
import { CreateCampaignDto } from './dto/marketing-campaign.dto';

@ApiTags('Marketing Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing-campaigns')
export class MarketingCampaignController {
  constructor(private readonly service: MarketingCampaignService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCampaignDto) { return this.service.create(user.organizationId, dto); }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAll(user.organizationId); }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findOne(user.organizationId, id); }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() data: any) { return this.service.update(user.organizationId, id, data); }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: string) { return this.service.updateStatus(user.organizationId, id, status); }

  @Get(':id/roi')
  getRoi(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.getRoi(user.organizationId, id); }
}
