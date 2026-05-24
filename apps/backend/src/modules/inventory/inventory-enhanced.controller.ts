import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { InventoryEnhancedService } from './inventory-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inventory-enhanced')
@UseGuards(JwtAuthGuard)
export class InventoryEnhancedController {
  constructor(private svc: InventoryEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }
  private userId(req: any) { return req.user.id || req.user.sub; }

  @Post('transfer-requests')
  createTransfer(@Req() req: any, @Body() dto: any) { return this.svc.createTransferRequest(this.orgId(req), this.userId(req), dto); }
  @Get('transfer-requests')
  getTransfers(@Req() req: any) { return this.svc.findTransferRequests(this.orgId(req)); }

  @Post('inventory-counts')
  createCount(@Req() req: any, @Body() dto: any) { return this.svc.createInventoryCount(this.orgId(req), this.userId(req), dto); }
  @Post('inventory-counts/:id/post')
  postCount(@Req() req: any, @Param('id') id: string) { return this.svc.postInventoryCount(this.orgId(req), this.userId(req), id); }

  @Get('items-detailed')
  getItemsDetailed(@Req() req: any) { return this.svc.findItemsWithDetails(this.orgId(req)); }

  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getInventoryEnhancedSummary(this.orgId(req)); }
}
