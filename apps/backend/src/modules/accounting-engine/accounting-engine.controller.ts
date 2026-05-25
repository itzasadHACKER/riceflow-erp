import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Request,
} from '@nestjs/common';
import { GeneralLedgerService } from './general-ledger.service';
import { StockLedgerService } from './stock-ledger.service';
import { PaymentEntryService } from './payment-entry.service';
import { DocumentLifecycleService } from './document-lifecycle.service';
import {
  PostToLedgerDto,
  ReverseLedgerDto,
  GLReportFilterDto,
  BalanceSheetFilterDto,
  ProfitLossFilterDto,
  AgingFilterDto,
  PaymentEntryDto,
} from './dto/gl-entry.dto';

@Controller('api/v1/accounting-engine')
export class AccountingEngineController {
  constructor(
    private readonly glService: GeneralLedgerService,
    private readonly stockLedgerService: StockLedgerService,
    private readonly paymentEntryService: PaymentEntryService,
    private readonly docLifecycleService: DocumentLifecycleService,
  ) {}

  // ===== GENERAL LEDGER =====

  @Post('gl/post')
  async postToLedger(@Request() req: any, @Body() dto: PostToLedgerDto) {
    return this.glService.postToLedger(
      req.user.organizationId,
      req.user.id,
      dto,
    );
  }

  @Post('gl/reverse')
  async reverseLedger(@Request() req: any, @Body() dto: ReverseLedgerDto) {
    return this.glService.reverseLedgerEntries(
      req.user.organizationId,
      req.user.id,
      dto.voucherType,
      dto.voucherNo,
      dto.voucherId,
      dto.reversalDate,
      dto.remarks,
    );
  }

  @Get('gl/report')
  async getGLReport(@Request() req: any, @Query() filters: GLReportFilterDto) {
    return this.glService.getGeneralLedgerReport(
      req.user.organizationId,
      filters,
    );
  }

  @Get('gl/trial-balance')
  async getTrialBalance(
    @Request() req: any,
    @Query('fiscalYear') fiscalYear?: string,
    @Query('asOfDate') asOfDate?: string,
    @Query('costCenterId') costCenterId?: string,
  ) {
    return this.glService.getTrialBalance(
      req.user.organizationId,
      fiscalYear,
      asOfDate,
      costCenterId,
    );
  }

  @Get('gl/balance-sheet')
  async getBalanceSheet(
    @Request() req: any,
    @Query() filters: BalanceSheetFilterDto,
  ) {
    return this.glService.getBalanceSheet(req.user.organizationId, filters);
  }

  @Get('gl/profit-loss')
  async getProfitAndLoss(
    @Request() req: any,
    @Query() filters: ProfitLossFilterDto,
  ) {
    return this.glService.getProfitAndLoss(req.user.organizationId, filters);
  }

  @Get('gl/aging')
  async getAgingReport(
    @Request() req: any,
    @Query() filters: AgingFilterDto,
  ) {
    return this.glService.getAgingReport(req.user.organizationId, filters);
  }

  @Get('gl/account-balance/:accountId')
  async getAccountBalance(
    @Request() req: any,
    @Param('accountId') accountId: string,
    @Query('asOfDate') asOfDate?: string,
    @Query('costCenterId') costCenterId?: string,
  ) {
    return this.glService.getAccountBalanceFromGL(
      req.user.organizationId,
      accountId,
      asOfDate,
      costCenterId,
    );
  }

  @Get('gl/party-outstanding')
  async getPartyOutstanding(
    @Request() req: any,
    @Query('partyType') partyType: string,
    @Query('partyId') partyId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.glService.getPartyOutstanding(
      req.user.organizationId,
      partyType,
      partyId,
      asOfDate,
    );
  }

  // ===== STOCK LEDGER =====

  @Get('stock/balance')
  async getStockBalance(
    @Request() req: any,
    @Query('warehouseId') warehouseId?: string,
    @Query('riceVarietyId') riceVarietyId?: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.stockLedgerService.getStockBalance(
      req.user.organizationId,
      warehouseId,
      riceVarietyId,
      asOfDate,
    );
  }

  @Get('stock/ledger')
  async getStockLedger(
    @Request() req: any,
    @Query('riceVarietyId') riceVarietyId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stockLedgerService.getStockLedgerReport(
      req.user.organizationId,
      riceVarietyId,
      warehouseId,
      fromDate,
      toDate,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('stock/valuation-summary')
  async getValuationSummary(@Request() req: any) {
    return this.stockLedgerService.getInventoryValuationSummary(
      req.user.organizationId,
    );
  }

  // ===== PAYMENT ENTRIES =====

  @Post('payments')
  async createPayment(@Request() req: any, @Body() dto: PaymentEntryDto) {
    return this.paymentEntryService.createPaymentEntry(
      req.user.organizationId,
      req.user.id,
      dto,
    );
  }

  @Post('payments/:id/submit')
  async submitPayment(@Request() req: any, @Param('id') id: string) {
    return this.paymentEntryService.submitPaymentEntry(
      req.user.organizationId,
      req.user.id,
      id,
    );
  }

  @Post('payments/:id/cancel')
  async cancelPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.paymentEntryService.cancelPaymentEntry(
      req.user.organizationId,
      req.user.id,
      id,
      reason,
    );
  }

  @Get('payments')
  async listPayments(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('partyType') partyType?: string,
    @Query('partyId') partyId?: string,
    @Query('paymentType') paymentType?: string,
    @Query('docStatus') docStatus?: string,
  ) {
    return this.paymentEntryService.listPaymentEntries(
      req.user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      partyType,
      partyId,
      paymentType,
      docStatus !== undefined ? parseInt(docStatus) : undefined,
    );
  }

  @Get('payments/:id')
  async getPayment(@Request() req: any, @Param('id') id: string) {
    return this.paymentEntryService.getPaymentEntry(
      req.user.organizationId,
      id,
    );
  }

  @Get('payments/outstanding-invoices')
  async getOutstandingInvoices(
    @Request() req: any,
    @Query('partyType') partyType: string,
    @Query('partyId') partyId: string,
  ) {
    return this.paymentEntryService.getOutstandingInvoices(
      req.user.organizationId,
      partyType,
      partyId,
    );
  }

  // ===== DOCUMENT LIFECYCLE =====

  @Post('journal-entry/:id/submit')
  async submitJournalEntry(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.docLifecycleService.submitJournalEntry(
      req.user.organizationId,
      req.user.id,
      id,
    );
  }

  @Post('journal-entry/:id/cancel')
  async cancelJournalEntry(
    @Request() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.docLifecycleService.cancelJournalEntry(
      req.user.organizationId,
      req.user.id,
      id,
      reason,
    );
  }

  @Post('journal-entry/:id/amend')
  async amendJournalEntry(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.docLifecycleService.amendJournalEntry(
      req.user.organizationId,
      req.user.id,
      id,
    );
  }
}
