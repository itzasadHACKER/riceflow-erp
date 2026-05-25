import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { SalesEnhancedService } from './sales-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales-enhanced')
@UseGuards(JwtAuthGuard)
export class SalesEnhancedController {
  constructor(private svc: SalesEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }
  private userId(req: any) { return req.user.id || req.user.sub; }

  // Running Balance
  @Get('running-balance')
  getBalance(@Req() req: any, @Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.svc.getRunningBalance(this.orgId(req), entityType, entityId);
  }

  // Credit Memos
  @Post('credit-memos')
  createCreditMemo(@Req() req: any, @Body() dto: any) { return this.svc.createCreditMemo(this.orgId(req), this.userId(req), dto); }
  @Get('credit-memos')
  getCreditMemos(@Req() req: any) { return this.svc.findAllCreditMemos(this.orgId(req)); }
  @Patch('credit-memos/:id/post')
  postCreditMemo(@Req() req: any, @Param('id') id: string) { return this.svc.postCreditMemo(this.orgId(req), this.userId(req), id); }

  // Debit Notes
  @Post('debit-notes')
  createDebitNote(@Req() req: any, @Body() dto: any) { return this.svc.createDebitNote(this.orgId(req), this.userId(req), dto); }
  @Get('debit-notes')
  getDebitNotes(@Req() req: any) { return this.svc.findAllDebitNotes(this.orgId(req)); }
  @Patch('debit-notes/:id/post')
  postDebitNote(@Req() req: any, @Param('id') id: string) { return this.svc.postDebitNote(this.orgId(req), this.userId(req), id); }

  // Sales Returns
  @Post('sales-returns')
  createSalesReturn(@Req() req: any, @Body() dto: any) { return this.svc.createSalesReturn(this.orgId(req), this.userId(req), dto); }
  @Get('sales-returns')
  getSalesReturns(@Req() req: any) { return this.svc.findAllSalesReturns(this.orgId(req)); }
  @Patch('sales-returns/:id/approve')
  approveSalesReturn(@Req() req: any, @Param('id') id: string) { return this.svc.approveSalesReturn(this.orgId(req), this.userId(req), id); }

  // Purchase Returns
  @Post('purchase-returns')
  createPurchaseReturn(@Req() req: any, @Body() dto: any) { return this.svc.createPurchaseReturn(this.orgId(req), this.userId(req), dto); }
  @Get('purchase-returns')
  getPurchaseReturns(@Req() req: any) { return this.svc.findAllPurchaseReturns(this.orgId(req)); }
  @Patch('purchase-returns/:id/approve')
  approvePurchaseReturn(@Req() req: any, @Param('id') id: string) { return this.svc.approvePurchaseReturn(this.orgId(req), this.userId(req), id); }

  // Bank Deposits
  @Post('bank-deposits')
  createBankDeposit(@Req() req: any, @Body() dto: any) { return this.svc.createBankDeposit(this.orgId(req), this.userId(req), dto); }

  // Payments
  @Post('payments')
  createPayment(@Req() req: any, @Body() dto: any) { return this.svc.createPayment(this.orgId(req), this.userId(req), dto); }

  // Summary
  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getEnhancedSummary(this.orgId(req)); }
}
