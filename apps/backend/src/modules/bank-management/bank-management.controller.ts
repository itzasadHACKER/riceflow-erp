import {
  Controller,
  Get,
  Post,
  Patch,
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
import { BankManagementService } from './bank-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import {
  CreateBankReconciliationDto,
  MatchReconciliationDto,
  CreateChequeDto,
  UpdateChequeStatusDto,
  BankFilterDto,
} from './dto/bank.dto';

@ApiTags('bank-management')
@Controller('bank-management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BankManagementController {
  constructor(private readonly bankManagementService: BankManagementService) {}

  // ===== RECONCILIATION =====

  @Post('reconciliation')
  @ApiOperation({ summary: 'Create reconciliation entry' })
  async createReconciliation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBankReconciliationDto,
  ) {
    const result = await this.bankManagementService.createReconciliationEntry(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get('reconciliation')
  @ApiOperation({ summary: 'List reconciliation entries' })
  async getReconciliationEntries(
    @CurrentUser() user: JwtPayload,
    @Query() filter: BankFilterDto,
  ) {
    const result = await this.bankManagementService.getReconciliationEntries(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Patch('reconciliation/:id/match')
  @ApiOperation({ summary: 'Match reconciliation entry' })
  async matchReconciliation(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MatchReconciliationDto,
  ) {
    const result = await this.bankManagementService.matchReconciliation(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(result);
  }

  @Get('reconciliation/summary/:bankAccountId')
  @ApiOperation({ summary: 'Get reconciliation summary for a bank account' })
  async getReconciliationSummary(
    @CurrentUser() user: JwtPayload,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
  ) {
    const result = await this.bankManagementService.getReconciliationSummary(
      user.organizationId,
      bankAccountId,
    );
    return createResponse(result);
  }

  // ===== CHEQUES =====

  @Post('cheques')
  @ApiOperation({ summary: 'Create cheque entry' })
  async createCheque(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateChequeDto,
  ) {
    const result = await this.bankManagementService.createCheque(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get('cheques')
  @ApiOperation({ summary: 'List cheques' })
  async getCheques(
    @CurrentUser() user: JwtPayload,
    @Query() filter: BankFilterDto,
  ) {
    const result = await this.bankManagementService.getCheques(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Patch('cheques/:id/status')
  @ApiOperation({ summary: 'Update cheque status' })
  async updateChequeStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChequeStatusDto,
  ) {
    const result = await this.bankManagementService.updateChequeStatus(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(result);
  }

  // ===== BANK BOOK =====

  @Get('bank-book/:bankAccountId')
  @ApiOperation({ summary: 'Get bank book (ledger for bank account)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getBankBook(
    @CurrentUser() user: JwtPayload,
    @Param('bankAccountId', ParseUUIDPipe) bankAccountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.bankManagementService.getBankBook(
      user.organizationId,
      bankAccountId,
      startDate,
      endDate,
    );
    return createResponse(result);
  }
}
