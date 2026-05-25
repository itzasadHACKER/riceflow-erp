import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountingEngineService } from './accounting-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('accounting-engine')
@UseGuards(JwtAuthGuard)
export class AccountingEngineController {
  constructor(private readonly engine: AccountingEngineService) {}

  // ===== PERIOD LOCKING =====

  @Patch('periods/:fiscalYearId/lock')
  lockPeriod(
    @CurrentUser('organizationId') orgId: string,
    @Param('fiscalYearId') fyId: string,
  ) {
    return this.engine.lockPeriod(orgId, fyId);
  }

  @Patch('periods/:fiscalYearId/unlock')
  unlockPeriod(
    @CurrentUser('organizationId') orgId: string,
    @Param('fiscalYearId') fyId: string,
  ) {
    return this.engine.unlockPeriod(orgId, fyId);
  }

  // ===== TRIAL BALANCE VERIFICATION =====

  @Get('verify-trial-balance')
  verifyTrialBalance(
    @CurrentUser('organizationId') orgId: string,
    @Query('fiscalYearId') fyId?: string,
  ) {
    return this.engine.verifyTrialBalance(orgId, fyId);
  }

  // ===== ACCOUNT BALANCE =====

  @Get('account-balance/:accountId')
  getAccountBalance(
    @CurrentUser('organizationId') orgId: string,
    @Param('accountId') accountId: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    return this.engine.getAccountBalance(orgId, accountId, asOfDate);
  }

  // ===== FISCAL YEAR CLOSING =====

  @Post('close-fiscal-year/:fiscalYearId')
  closeFiscalYear(
    @CurrentUser('organizationId') orgId: string,
    @CurrentUser('sub') userId: string,
    @Param('fiscalYearId') fyId: string,
  ) {
    return this.engine.closeFiscalYear(orgId, userId, fyId);
  }

  // ===== OPENING BALANCES =====

  @Post('opening-balances')
  importOpeningBalances(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { balances: { accountCode: string; debit: number; credit: number }[] },
  ) {
    return this.engine.importOpeningBalances(orgId, body.balances);
  }

  // ===== INTEGRITY CHECKS =====

  @Get('integrity-checks')
  runIntegrityChecks(@CurrentUser('organizationId') orgId: string) {
    return this.engine.runIntegrityChecks(orgId);
  }

  // ===== AUDIT TRAIL =====

  @Get('audit-trail')
  getAuditTrail(
    @CurrentUser('organizationId') orgId: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('action') action?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.engine.getAuditTrail(orgId, {
      entityType,
      entityId,
      userId,
      fromDate,
      toDate,
      action,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  // ===== DATA IMPORT =====

  @Post('import/customers')
  importCustomers(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { customers: { name: string; phone?: string; email?: string; address?: string; openingBalance?: number }[] },
  ) {
    return this.engine.importCustomers(orgId, body.customers);
  }

  @Post('import/suppliers')
  importSuppliers(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { suppliers: { name: string; phone?: string; email?: string; address?: string; openingBalance?: number }[] },
  ) {
    return this.engine.importSuppliers(orgId, body.suppliers);
  }

  @Post('import/items')
  importItems(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { items: { lotNumber: string; warehouseId: string; riceVarietyId: string; quantity: number; unit?: string; valuationRate?: number }[] },
  ) {
    return this.engine.importItems(orgId, body.items);
  }

  // ===== DATABASE STATS =====

  @Get('database-stats')
  getDatabaseStats(@CurrentUser('organizationId') orgId: string) {
    return this.engine.getDatabaseStats(orgId);
  }
}
