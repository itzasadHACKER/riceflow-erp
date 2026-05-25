import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FinanceEnhancedService } from './finance-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance-enhanced')
@UseGuards(JwtAuthGuard)
export class FinanceEnhancedController {
  constructor(private svc: FinanceEnhancedService) {}

  private orgId(req: any) { return req.user.organizationId; }
  private userId(req: any) { return req.user.id || req.user.sub; }

  @Post('recurring-journals')
  createRecurring(@Req() req: any, @Body() dto: any) { return this.svc.createRecurringJournal(this.orgId(req), this.userId(req), dto); }
  @Get('recurring-journals')
  getRecurring(@Req() req: any) { return this.svc.findRecurringJournals(this.orgId(req)); }
  @Post('recurring-journals/:id/execute')
  executeRecurring(@Req() req: any, @Param('id') id: string) { return this.svc.executeRecurringJournal(this.orgId(req), this.userId(req), id); }

  @Post('bank-statement-import')
  importStatement(@Req() req: any, @Body() dto: any) { return this.svc.importBankStatement(this.orgId(req), this.userId(req), dto); }

  @Post('report-templates')
  createTemplate(@Req() req: any, @Body() dto: any) { return this.svc.createReportTemplate(this.orgId(req), dto); }
  @Get('report-templates')
  getTemplates(@Req() req: any) { return this.svc.findReportTemplates(this.orgId(req)); }

  @Get('branches')
  getBranches(@Req() req: any) { return this.svc.findBranches(this.orgId(req)); }
  @Get('branches/:id/pnl')
  getBranchPnL(@Req() req: any, @Param('id') id: string) { return this.svc.getBranchPnL(this.orgId(req), id); }

  @Get('period-check')
  checkPeriod(@Req() req: any, @Query('date') date: string) { return this.svc.checkPeriodAuth(this.orgId(req), this.userId(req), new Date(date)); }

  @Get('summary')
  getSummary(@Req() req: any) { return this.svc.getFinanceEnhancedSummary(this.orgId(req)); }
}
