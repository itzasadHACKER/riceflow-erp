import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { Phase1CoreService } from './phase1-core.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class Phase1CoreController {
  constructor(private readonly phase1: Phase1CoreService) {}

  // ===== SALES INVOICE WITH LINE ITEMS =====

  @Post('sales/invoices-v2')
  createInvoice(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: any) {
    return this.phase1.createSalesInvoiceWithItems(user.organizationId, user.userId, dto);
  }

  @Post('sales/invoices-v2/:id/post')
  postInvoice(
    @CurrentUser() user: { organizationId: string; userId: string },
    @Param('id') id: string,
    @Body('fiscalYearId') fiscalYearId: string,
  ) {
    return this.phase1.postSalesInvoice(user.organizationId, user.userId, id, fiscalYearId);
  }

  @Get('sales/invoices-v2/:id')
  getInvoice(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.phase1.getSalesInvoice(user.organizationId, id);
  }

  // ===== PURCHASE POST WITH STOCK =====

  @Post('procurement/purchases/:id/post-with-stock')
  postPurchaseWithStock(
    @CurrentUser() user: { organizationId: string; userId: string },
    @Param('id') id: string,
    @Body() body: { fiscalYearId: string; warehouseId: string },
  ) {
    return this.phase1.postPaddyPurchaseWithStock(
      user.organizationId, user.userId, id, body.fiscalYearId, body.warehouseId,
    );
  }

  // ===== PAYMENT RECORDING =====

  @Post('payments')
  recordPayment(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: any) {
    return this.phase1.recordPayment(user.organizationId, user.userId, dto);
  }

  @Post('payments/:id/post')
  postPayment(
    @CurrentUser() user: { organizationId: string; userId: string },
    @Param('id') id: string,
    @Body('fiscalYearId') fiscalYearId: string,
  ) {
    return this.phase1.postPayment(user.organizationId, user.userId, id, fiscalYearId);
  }

  @Get('payments')
  getPayments(
    @CurrentUser() user: { organizationId: string },
    @Query('partyId') partyId?: string,
    @Query('direction') direction?: string,
  ) {
    return this.phase1.getPayments(user.organizationId, partyId, direction);
  }

  // ===== PARTY LEDGER (KHATA) =====

  @Get('khata/:partyType/:partyId')
  getKhata(
    @CurrentUser() user: { organizationId: string },
    @Param('partyType') partyType: string,
    @Param('partyId') partyId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.phase1.getPartyLedger(
      user.organizationId,
      partyType.toUpperCase() as 'CUSTOMER' | 'SUPPLIER',
      partyId, fromDate, toDate,
    );
  }

  @Get('party-balance/:partyType/:partyId')
  getPartyBalance(
    @CurrentUser() user: { organizationId: string },
    @Param('partyType') partyType: string,
    @Param('partyId') partyId: string,
  ) {
    return this.phase1.getPartyBalance(user.organizationId, partyType.toUpperCase(), partyId);
  }

  // ===== WEIGHBRIDGE =====

  @Post('weighbridge')
  createSlip(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: any) {
    return this.phase1.createWeighbridgeSlip(user.organizationId, user.userId, dto);
  }

  @Patch('weighbridge/:id/tare')
  recordTare(
    @CurrentUser() user: { organizationId: string },
    @Param('id') id: string,
    @Body('tareWeight') tareWeight: number,
  ) {
    return this.phase1.recordTareWeight(user.organizationId, id, tareWeight);
  }

  @Get('weighbridge')
  getSlips(
    @CurrentUser() user: { organizationId: string },
    @Query('date') date?: string,
    @Query('vehicleNumber') vehicleNumber?: string,
  ) {
    return this.phase1.getWeighbridgeSlips(user.organizationId, date, vehicleNumber);
  }

  @Get('weighbridge/:id')
  getSlip(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.phase1.getWeighbridgeSlip(user.organizationId, id);
  }

  // ===== BARDANA (BAGS) =====

  @Post('bardana')
  createBardana(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: any) {
    return this.phase1.createBardanaTransaction(user.organizationId, user.userId, dto);
  }

  @Get('bardana')
  getBardana(
    @CurrentUser() user: { organizationId: string },
    @Query('partyId') partyId?: string,
    @Query('bagType') bagType?: string,
  ) {
    return this.phase1.getBardanaTransactions(user.organizationId, partyId, bagType);
  }

  @Get('bardana/summary')
  getBardanaSummary(
    @CurrentUser() user: { organizationId: string },
    @Query('partyId') partyId?: string,
  ) {
    return this.phase1.getBardanaSummary(user.organizationId, partyId);
  }

  // ===== PURCHASE INVOICE (NON-PADDY) =====

  @Post('purchase-invoices')
  createPurchaseInvoice(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: any) {
    return this.phase1.createPurchaseInvoice(user.organizationId, user.userId, dto);
  }

  @Get('purchase-invoices')
  getPurchaseInvoices(
    @CurrentUser() user: { organizationId: string },
    @Query('supplierId') supplierId?: string,
  ) {
    return this.phase1.getPurchaseInvoices(user.organizationId, supplierId);
  }

  @Get('purchase-invoices/:id')
  getPurchaseInvoice(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    return this.phase1.getPurchaseInvoice(user.organizationId, id);
  }

  // ===== TAX =====

  @Get('tax/applicable-rate')
  getTaxRate(
    @CurrentUser() user: { organizationId: string },
    @Query('itemType') itemType?: string,
  ) {
    return this.phase1.getApplicableTaxRate(user.organizationId, itemType);
  }
}
