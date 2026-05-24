import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProductionAnalyticsService } from './production-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('production-analytics')
@UseGuards(JwtAuthGuard)
export class ProductionAnalyticsController {
  constructor(private readonly analytics: ProductionAnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser('organizationId') orgId: string) {
    return this.analytics.getProductionDashboard(orgId);
  }

  @Get('recovery')
  getRecoveryAnalysis(
    @CurrentUser('organizationId') orgId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.analytics.getRecoveryAnalysis(orgId, fromDate, toDate);
  }

  @Get('costs')
  getCostAnalysis(
    @CurrentUser('organizationId') orgId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.analytics.getCostAnalysis(orgId, fromDate, toDate);
  }

  @Get('variety-wise')
  getVarietyWise(@CurrentUser('organizationId') orgId: string) {
    return this.analytics.getVarietyWiseProduction(orgId);
  }

  @Get('capacity')
  getCapacityUtilization(
    @CurrentUser('organizationId') orgId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.analytics.getCapacityUtilization(orgId, fromDate, toDate);
  }
}
