import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PdfReportService } from './pdf-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports/pdf')
@UseGuards(JwtAuthGuard)
export class PdfReportController {
  constructor(private readonly pdfService: PdfReportService) {}

  @Get('invoice/:invoiceId')
  getInvoicePdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.pdfService.generateInvoiceHtml(orgId, invoiceId);
  }

  @Get('trial-balance')
  getTrialBalancePdf(
    @CurrentUser('organizationId') orgId: string,
    @Query('fiscalYearId') fyId?: string,
  ) {
    return this.pdfService.generateTrialBalanceHtml(orgId, fyId);
  }

  @Get('profit-loss')
  getProfitLossPdf(
    @CurrentUser('organizationId') orgId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.pdfService.generateProfitLossHtml(orgId, fromDate, toDate);
  }

  @Get('balance-sheet')
  getBalanceSheetPdf(
    @CurrentUser('organizationId') orgId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.pdfService.generateBalanceSheetHtml(orgId, asOfDate);
  }

  @Get('delivery-challan/:challanId')
  getDeliveryChallanPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('challanId') challanId: string,
  ) {
    return this.pdfService.generateDeliveryChallanHtml(orgId, challanId);
  }

  @Get('purchase-order/:poId')
  getPurchaseOrderPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('poId') poId: string,
  ) {
    return this.pdfService.generatePurchaseOrderHtml(orgId, poId);
  }

  @Get('general-ledger/:accountId')
  getGeneralLedgerPdf(
    @CurrentUser('organizationId') orgId: string,
    @Param('accountId') accountId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.pdfService.generateGeneralLedgerHtml(orgId, accountId, fromDate, toDate);
  }
}
