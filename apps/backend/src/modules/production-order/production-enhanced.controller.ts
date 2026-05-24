import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProductionEnhancedService } from './production-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('production-enhanced')
@UseGuards(JwtAuthGuard)
export class ProductionEnhancedController {
  constructor(private svc: ProductionEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }

  @Get('resource-capacity')
  getCapacity(@Req() req: any) { return this.svc.getResourceCapacity(this.orgId(req)); }

  @Post('routings')
  createRouting(@Req() req: any, @Body() dto: any) { return this.svc.createRouting(this.orgId(req), dto); }
  @Get('routings')
  getRoutings(@Req() req: any) { return this.svc.findRoutings(this.orgId(req)); }

  @Post('cost-rollup/:orderId')
  costRollup(@Req() req: any, @Param('orderId') orderId: string) { return this.svc.calculateCostRollup(this.orgId(req), orderId); }
  @Get('production-costs')
  getCosts(@Req() req: any) { return this.svc.getProductionCosts(this.orgId(req)); }

  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getProductionEnhancedSummary(this.orgId(req)); }
}
