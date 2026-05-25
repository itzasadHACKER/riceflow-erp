import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PurchaseEnhancedService } from './purchase-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('purchase-enhanced')
@UseGuards(JwtAuthGuard)
export class PurchaseEnhancedController {
  constructor(private svc: PurchaseEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }
  private userId(req: any) { return req.user.id || req.user.sub; }

  @Post('blanket-agreements')
  createBlanket(@Req() req: any, @Body() dto: any) { return this.svc.createPurchaseBlanketAgreement(this.orgId(req), this.userId(req), dto); }
  @Get('blanket-agreements')
  getBlankets(@Req() req: any) { return this.svc.findPurchaseBlanketAgreements(this.orgId(req)); }

  @Get('three-way-match/:poId')
  threeWayMatch(@Req() req: any, @Param('poId') poId: string) { return this.svc.threeWayMatch(this.orgId(req), poId); }

  @Post('landed-costs')
  landedCosts(@Req() req: any, @Body() dto: any) { return this.svc.calculateLandedCosts(this.orgId(req), dto); }

  @Post('ap-credit-memos')
  apCreditMemo(@Req() req: any, @Body() dto: any) { return this.svc.createApCreditMemo(this.orgId(req), this.userId(req), dto); }

  @Post('goods-returns')
  goodsReturn(@Req() req: any, @Body() dto: any) { return this.svc.createGoodsReturn(this.orgId(req), this.userId(req), dto); }

  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getPurchaseEnhancedSummary(this.orgId(req)); }
}
