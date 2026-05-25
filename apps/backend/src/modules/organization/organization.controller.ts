import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current organization details' })
  async getCurrent(@CurrentUser() user: JwtPayload) {
    const org = await this.organizationService.findById(user.organizationId);
    return createResponse(org);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update current organization' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const org = await this.organizationService.update(user.organizationId, dto);
    return createResponse(org);
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(@CurrentUser() user: JwtPayload) {
    const stats = await this.organizationService.getDashboardStats(
      user.organizationId,
    );
    return createResponse(stats);
  }
}
