import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';

@ApiTags('reporting')
@Controller('reporting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const kpis = await this.reportingService.getDashboardKPIs(
      user.organizationId,
    );
    return createResponse(kpis);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProfitLoss(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getProfitAndLossReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance Sheet report' })
  @ApiQuery({ name: 'asOfDate', required: true })
  async getBalanceSheet(
    @CurrentUser() user: JwtPayload,
    @Query('asOfDate') asOfDate: string,
  ) {
    const report = await this.reportingService.getBalanceSheetReport(
      user.organizationId,
      asOfDate,
    );
    return createResponse(report);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial Balance report' })
  @ApiQuery({ name: 'asOfDate', required: false })
  async getTrialBalance(
    @CurrentUser() user: JwtPayload,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const report = await this.reportingService.getTrialBalanceReport(
      user.organizationId,
      asOfDate,
    );
    return createResponse(report);
  }

  @Get('procurement')
  @ApiOperation({ summary: 'Procurement report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProcurementReport(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getProcurementReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Sales report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getSalesReport(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getSalesReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Inventory valuation report' })
  async getInventoryReport(@CurrentUser() user: JwtPayload) {
    const report = await this.reportingService.getInventoryReport(
      user.organizationId,
    );
    return createResponse(report);
  }

  @Get('stock-movements')
  @ApiOperation({ summary: 'Stock movement report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getStockMovementReport(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getStockMovementReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('production')
  @ApiOperation({ summary: 'Production report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProductionReport(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getProductionReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('hr')
  @ApiOperation({ summary: 'HR & Payroll report' })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  async getHrReport(
    @CurrentUser() user: JwtPayload,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const report = await this.reportingService.getHrReport(
      user.organizationId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return createResponse(report);
  }

  @Get('receivables')
  @ApiOperation({ summary: 'Receivables aging report' })
  async getReceivablesReport(@CurrentUser() user: JwtPayload) {
    const report = await this.reportingService.getReceivablesReport(
      user.organizationId,
    );
    return createResponse(report);
  }

  @Get('payables')
  @ApiOperation({ summary: 'Payables report' })
  async getPayablesReport(@CurrentUser() user: JwtPayload) {
    const report = await this.reportingService.getPayablesReport(
      user.organizationId,
    );
    return createResponse(report);
  }

  @Get('transport')
  @ApiOperation({ summary: 'Transport & freight report' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getTransportReport(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const report = await this.reportingService.getTransportReport(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(report);
  }

  @Get('expense')
  @ApiOperation({ summary: 'Expense report (daily/mtd/ytd/monthly/yearly/custom)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'mtd', 'monthly', 'ytd', 'yearly', 'custom'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getExpenseReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period = 'mtd',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const report = await this.reportingService.getExpenseReport(user.organizationId, period, fromDate, toDate);
    return createResponse(report);
  }

  @Get('gate-pass')
  @ApiOperation({ summary: 'Gate pass report' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'mtd', 'monthly', 'ytd', 'yearly', 'custom'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getGatePassReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period = 'mtd',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const report = await this.reportingService.getGatePassReport(user.organizationId, period, fromDate, toDate);
    return createResponse(report);
  }

  @Get('assets')
  @ApiOperation({ summary: 'Asset summary report' })
  async getAssetReport(@CurrentUser() user: JwtPayload) {
    const report = await this.reportingService.getAssetReport(user.organizationId);
    return createResponse(report);
  }

  @Get('crm')
  @ApiOperation({ summary: 'CRM report' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'mtd', 'monthly', 'ytd', 'yearly', 'custom'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getCrmReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period = 'mtd',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const report = await this.reportingService.getCrmReport(user.organizationId, period, fromDate, toDate);
    return createResponse(report);
  }

  @Get('machines')
  @ApiOperation({ summary: 'Machine report' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'mtd', 'monthly', 'ytd', 'yearly', 'custom'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getMachineReport(
    @CurrentUser() user: JwtPayload,
    @Query('period') period = 'mtd',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const report = await this.reportingService.getMachineReport(user.organizationId, period, fromDate, toDate);
    return createResponse(report);
  }

  @Get('universal/:module')
  @ApiOperation({ summary: 'Universal report for any module (daily/mtd/ytd/monthly/yearly/custom)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'mtd', 'monthly', 'ytd', 'yearly', 'custom'] })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async getUniversalReport(
    @CurrentUser() user: JwtPayload,
    @Param('module') module: string,
    @Query('period') period = 'mtd',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const report = await this.reportingService.getUniversalReport(user.organizationId, module, period, fromDate, toDate);
    return createResponse(report);
  }
}
