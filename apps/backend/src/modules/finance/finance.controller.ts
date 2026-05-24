import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import {
  CreateFiscalYearDto,
  UpdateFiscalYearDto,
} from './dto/fiscal-year.dto';
import {
  CreateChartOfAccountDto,
  UpdateChartOfAccountDto,
} from './dto/chart-of-account.dto';
import {
  CreateJournalEntryDto,
  JournalEntryFilterDto,
} from './dto/journal-entry.dto';
import {
  CreatePaymentVoucherDto,
  CreateReceiptVoucherDto,
  CreateBankAccountDto,
  UpdateBankAccountDto,
  CreateTaxConfigDto,
  CreateExpenseClaimDto,
  LedgerFilterDto,
  TrialBalanceFilterDto,
} from './dto/voucher.dto';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ===== FISCAL YEAR =====

  @Post('fiscal-years')
  @ApiOperation({ summary: 'Create fiscal year' })
  async createFiscalYear(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFiscalYearDto,
  ) {
    const fy = await this.financeService.createFiscalYear(
      user.organizationId,
      dto,
    );
    return createResponse(fy);
  }

  @Get('fiscal-years')
  @ApiOperation({ summary: 'List fiscal years' })
  async listFiscalYears(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.listFiscalYears(user.organizationId);
    return createResponse(data);
  }

  @Get('fiscal-years/active')
  @ApiOperation({ summary: 'Get active fiscal year' })
  async getActiveFiscalYear(@CurrentUser() user: JwtPayload) {
    const fy = await this.financeService.getActiveFiscalYear(
      user.organizationId,
    );
    return createResponse(fy);
  }

  @Get('fiscal-years/:id')
  @ApiOperation({ summary: 'Get fiscal year by ID' })
  async getFiscalYear(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const fy = await this.financeService.getFiscalYear(user.organizationId, id);
    return createResponse(fy);
  }

  @Patch('fiscal-years/:id')
  @ApiOperation({ summary: 'Update fiscal year' })
  async updateFiscalYear(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFiscalYearDto,
  ) {
    const fy = await this.financeService.updateFiscalYear(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(fy);
  }

  // ===== CHART OF ACCOUNTS =====

  @Post('accounts')
  @ApiOperation({ summary: 'Create chart of account' })
  async createAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChartOfAccountDto,
  ) {
    const account = await this.financeService.createAccount(
      user.organizationId,
      dto,
    );
    return createResponse(account);
  }

  @Post('accounts/seed')
  @ApiOperation({ summary: 'Seed default chart of accounts' })
  async seedAccounts(@CurrentUser() user: JwtPayload) {
    const result = await this.financeService.seedDefaultAccounts(
      user.organizationId,
    );
    return createResponse(result);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List all accounts' })
  async listAccounts(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.listAccounts(user.organizationId);
    return createResponse(data);
  }

  @Get('accounts/tree')
  @ApiOperation({ summary: 'Get account tree hierarchy' })
  async getAccountTree(@CurrentUser() user: JwtPayload) {
    const tree = await this.financeService.getAccountTree(user.organizationId);
    return createResponse(tree);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  async getAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const account = await this.financeService.getAccount(
      user.organizationId,
      id,
    );
    return createResponse(account);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update account' })
  async updateAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChartOfAccountDto,
  ) {
    const account = await this.financeService.updateAccount(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(account);
  }

  // ===== JOURNAL ENTRIES =====

  @Post('journal-entries')
  @ApiOperation({
    summary: 'Create journal entry with double-entry validation',
  })
  async createJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateJournalEntryDto,
  ) {
    const entry = await this.financeService.createJournalEntry(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(entry);
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post journal entry to general ledger' })
  async postJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const entry = await this.financeService.postJournalEntry(
      user.organizationId,
      user.sub,
      id,
    );
    return createResponse(entry);
  }

  @Get('journal-entries')
  @ApiOperation({ summary: 'List journal entries with filters' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listJournalEntries(
    @CurrentUser() user: JwtPayload,
    @Query() filter: JournalEntryFilterDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.listJournalEntries(
      user.organizationId,
      filter,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('journal-entries/:id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  async getJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const entry = await this.financeService.getJournalEntry(
      user.organizationId,
      id,
    );
    return createResponse(entry);
  }

  // ===== GENERAL LEDGER =====

  @Get('ledger')
  @ApiOperation({ summary: 'Get general ledger for an account' })
  async getGeneralLedger(
    @CurrentUser() user: JwtPayload,
    @Query() filter: LedgerFilterDto,
  ) {
    const ledger = await this.financeService.getGeneralLedger(
      user.organizationId,
      filter,
    );
    return createResponse(ledger);
  }

  // ===== TRIAL BALANCE =====

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get trial balance' })
  async getTrialBalance(
    @CurrentUser() user: JwtPayload,
    @Query() filter: TrialBalanceFilterDto,
  ) {
    const tb = await this.financeService.getTrialBalance(
      user.organizationId,
      filter,
    );
    return createResponse(tb);
  }

  // ===== PROFIT & LOSS =====

  @Get('profit-loss')
  @ApiOperation({ summary: 'Get profit and loss statement' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  async getProfitAndLoss(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('fiscalYearId') fiscalYearId?: string,
  ) {
    const pl = await this.financeService.getProfitAndLoss(
      user.organizationId,
      fromDate,
      toDate,
      fiscalYearId,
    );
    return createResponse(pl);
  }

  // ===== BALANCE SHEET =====

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get balance sheet' })
  @ApiQuery({ name: 'asOfDate', required: true })
  @ApiQuery({ name: 'fiscalYearId', required: false })
  async getBalanceSheet(
    @CurrentUser() user: JwtPayload,
    @Query('asOfDate') asOfDate: string,
    @Query('fiscalYearId') fiscalYearId?: string,
  ) {
    const bs = await this.financeService.getBalanceSheet(
      user.organizationId,
      asOfDate,
      fiscalYearId,
    );
    return createResponse(bs);
  }

  // ===== RECEIVABLES & PAYABLES =====

  @Get('receivables')
  @ApiOperation({ summary: 'Get receivables summary' })
  async getReceivables(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.getReceivablesSummary(
      user.organizationId,
    );
    return createResponse(data);
  }

  @Get('payables')
  @ApiOperation({ summary: 'Get payables summary' })
  async getPayables(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.getPayablesSummary(
      user.organizationId,
    );
    return createResponse(data);
  }

  // ===== BANK ACCOUNTS =====

  @Post('bank-accounts')
  @ApiOperation({ summary: 'Create bank account' })
  async createBankAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBankAccountDto,
  ) {
    const ba = await this.financeService.createBankAccount(
      user.organizationId,
      dto,
    );
    return createResponse(ba);
  }

  @Get('bank-accounts')
  @ApiOperation({ summary: 'List bank accounts' })
  async listBankAccounts(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.listBankAccounts(
      user.organizationId,
    );
    return createResponse(data);
  }

  @Patch('bank-accounts/:id')
  @ApiOperation({ summary: 'Update bank account' })
  async updateBankAccount(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBankAccountDto,
  ) {
    const ba = await this.financeService.updateBankAccount(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(ba);
  }

  // ===== PAYMENT VOUCHERS =====

  @Post('payment-vouchers')
  @ApiOperation({ summary: 'Create payment voucher with auto journal entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async createPaymentVoucher(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentVoucherDto,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const pv = await this.financeService.createPaymentVoucher(
      user.organizationId,
      user.sub,
      fiscalYearId,
      dto,
    );
    return createResponse(pv);
  }

  @Get('payment-vouchers')
  @ApiOperation({ summary: 'List payment vouchers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPaymentVouchers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.listPaymentVouchers(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== RECEIPT VOUCHERS =====

  @Post('receipt-vouchers')
  @ApiOperation({ summary: 'Create receipt voucher with auto journal entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async createReceiptVoucher(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReceiptVoucherDto,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const rv = await this.financeService.createReceiptVoucher(
      user.organizationId,
      user.sub,
      fiscalYearId,
      dto,
    );
    return createResponse(rv);
  }

  @Get('receipt-vouchers')
  @ApiOperation({ summary: 'List receipt vouchers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listReceiptVouchers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.listReceiptVouchers(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== TAX CONFIGURATION =====

  @Post('tax-configs')
  @ApiOperation({ summary: 'Create tax configuration' })
  async createTaxConfig(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaxConfigDto,
  ) {
    const tc = await this.financeService.createTaxConfig(
      user.organizationId,
      dto,
    );
    return createResponse(tc);
  }

  @Get('tax-configs')
  @ApiOperation({ summary: 'List tax configurations' })
  async listTaxConfigs(@CurrentUser() user: JwtPayload) {
    const data = await this.financeService.listTaxConfigs(user.organizationId);
    return createResponse(data);
  }

  // ===== EXPENSE CLAIMS =====

  @Post('expense-claims')
  @ApiOperation({ summary: 'Create expense claim' })
  async createExpenseClaim(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseClaimDto,
  ) {
    const claim = await this.financeService.createExpenseClaim(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(claim);
  }

  @Post('expense-claims/:id/approve')
  @ApiOperation({ summary: 'Approve expense claim with auto journal entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async approveExpenseClaim(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const claim = await this.financeService.approveExpenseClaim(
      user.organizationId,
      user.sub,
      id,
      fiscalYearId,
    );
    return createResponse(claim);
  }

  @Get('expense-claims')
  @ApiOperation({ summary: 'List expense claims' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listExpenseClaims(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.listExpenseClaims(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== CREDIT NOTES =====

  @Post('credit-notes')
  @ApiOperation({ summary: 'Create credit note' })
  async createCreditNote(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      date: string;
      customerId: string;
      salesInvoiceId?: string;
      totalAmount: number;
      taxAmount?: number;
      netAmount: number;
      reason?: string;
      narration?: string;
    },
  ) {
    const result = await this.financeService.createCreditNote(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('credit-notes')
  @ApiOperation({ summary: 'List credit notes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getCreditNotes(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.getCreditNotes(
      user.organizationId,
      { status, startDate, endDate, page, limit },
    );
    return createResponse(result);
  }

  @Post('credit-notes/:id/confirm')
  @ApiOperation({ summary: 'Confirm credit note and post GL entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async confirmCreditNote(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const result = await this.financeService.confirmCreditNote(
      user.organizationId,
      id,
      fiscalYearId,
    );
    return createResponse(result);
  }

  // ===== DEBIT NOTES =====

  @Post('debit-notes')
  @ApiOperation({ summary: 'Create debit note' })
  async createDebitNote(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      date: string;
      supplierId: string;
      purchaseId?: string;
      totalAmount: number;
      taxAmount?: number;
      netAmount: number;
      reason?: string;
      narration?: string;
    },
  ) {
    const result = await this.financeService.createDebitNote(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('debit-notes')
  @ApiOperation({ summary: 'List debit notes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDebitNotes(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.getDebitNotes(
      user.organizationId,
      { status, startDate, endDate, page, limit },
    );
    return createResponse(result);
  }

  @Post('debit-notes/:id/confirm')
  @ApiOperation({ summary: 'Confirm debit note and post GL entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async confirmDebitNote(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const result = await this.financeService.confirmDebitNote(
      user.organizationId,
      id,
      fiscalYearId,
    );
    return createResponse(result);
  }

  // ===== PURCHASE RETURNS =====

  @Post('purchase-returns')
  @ApiOperation({ summary: 'Create purchase return' })
  async createPurchaseReturn(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      date: string;
      supplierId: string;
      purchaseId?: string;
      warehouseId?: string;
      riceVarietyId?: string;
      quantity: number;
      rate: number;
      totalAmount: number;
      reason?: string;
      narration?: string;
    },
  ) {
    const result = await this.financeService.createPurchaseReturn(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('purchase-returns')
  @ApiOperation({ summary: 'List purchase returns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPurchaseReturns(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.getPurchaseReturns(
      user.organizationId,
      { status, startDate, endDate, page, limit },
    );
    return createResponse(result);
  }

  // ===== SALES RETURNS =====

  @Post('sales-returns')
  @ApiOperation({ summary: 'Create sales return' })
  async createSalesReturn(
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: {
      date: string;
      customerId: string;
      salesOrderId?: string;
      invoiceId?: string;
      warehouseId?: string;
      riceVarietyId?: string;
      quantity: number;
      rate: number;
      totalAmount: number;
      reason?: string;
      narration?: string;
    },
  ) {
    const result = await this.financeService.createSalesReturn(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('sales-returns')
  @ApiOperation({ summary: 'List sales returns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSalesReturns(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.financeService.getSalesReturns(
      user.organizationId,
      { status, startDate, endDate, page, limit },
    );
    return createResponse(result);
  }

  // ===== EDIT/DELETE POSTED ENTRIES (SAP-STYLE) =====

  @Patch('journal-entries/:id/edit-posted')
  @ApiOperation({ summary: 'Edit posted journal entry (SAP-style audit)' })
  async editPostedJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { narration?: string; reference?: string },
  ) {
    const result = await this.financeService.editPostedJournalEntry(
      user.organizationId,
      id,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Delete('journal-entries/:id')
  @ApiOperation({ summary: 'Soft delete journal entry with audit trail' })
  async deletePostedJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.financeService.deletePostedJournalEntry(
      user.organizationId,
      id,
      user.sub,
    );
    return createResponse(result);
  }

  @Post('journal-entries/:id/reverse')
  @ApiOperation({ summary: 'Reverse a posted journal entry' })
  async reverseJournalEntry(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { date: string; narration?: string; fiscalYearId: string },
  ) {
    const result = await this.financeService.reverseJournalEntry(
      user.organizationId,
      id,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  // ===== CASH BOOK =====

  @Get('cash-book')
  @ApiOperation({ summary: 'Get cash book' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getCashBook(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.financeService.getCashBook(
      user.organizationId,
      startDate,
      endDate,
    );
    return createResponse(result);
  }

  // ===== DAY BOOK =====

  @Get('day-book')
  @ApiOperation({ summary: 'Get day book for a specific date' })
  @ApiQuery({ name: 'date', required: true })
  async getDayBook(
    @CurrentUser() user: JwtPayload,
    @Query('date') date: string,
  ) {
    const result = await this.financeService.getDayBook(
      user.organizationId,
      date,
    );
    return createResponse(result);
  }

  // ===== ACCOUNT STATEMENT =====

  @Get('account-statement/:accountId')
  @ApiOperation({ summary: 'Get account statement with running balance' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAccountStatement(
    @CurrentUser() user: JwtPayload,
    @Param('accountId', ParseUUIDPipe) accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.financeService.getAccountStatement(
      user.organizationId,
      accountId,
      startDate,
      endDate,
    );
    return createResponse(result);
  }

  // ===== CASH FLOW STATEMENT =====

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow statement' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCashFlowStatement(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const result = await this.financeService.getCashFlowStatement(
      user.organizationId,
      startDate,
      endDate,
    );
    return createResponse(result);
  }
}
