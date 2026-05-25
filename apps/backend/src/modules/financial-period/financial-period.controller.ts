import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { FinancialPeriodService } from './financial-period.service';
import { CreateFinancialPeriodDto, CreateWithholdingTaxDto, CreateInternalReconciliationDto, CreateAdvancePaymentDto } from './dto/financial-period.dto';

@ApiTags('Financial Enhancements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financial-enhancements')
export class FinancialPeriodController {
  constructor(private readonly service: FinancialPeriodService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('periods')
  createPeriod(@CurrentUser() user: JwtPayload, @Body() dto: CreateFinancialPeriodDto) { return this.service.createPeriod(user.organizationId, dto); }

  @Get('periods')
  findPeriods(@CurrentUser() user: JwtPayload) { return this.service.findAllPeriods(user.organizationId); }

  @Patch('periods/:id/close')
  closePeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.closePeriod(user.organizationId, id, user.sub); }

  @Patch('periods/:id/reopen')
  reopenPeriod(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.reopenPeriod(user.organizationId, id); }

  @Post('withholding-tax')
  createWht(@CurrentUser() user: JwtPayload, @Body() dto: CreateWithholdingTaxDto) { return this.service.createWithholdingTax(user.organizationId, dto); }

  @Get('withholding-tax')
  findWht(@CurrentUser() user: JwtPayload) { return this.service.findWithholdingTaxes(user.organizationId); }

  @Post('reconciliations')
  createReconciliation(@CurrentUser() user: JwtPayload, @Body() dto: CreateInternalReconciliationDto) { return this.service.createInternalReconciliation(user.organizationId, dto); }

  @Get('reconciliations')
  findReconciliations(@CurrentUser() user: JwtPayload) { return this.service.findReconciliations(user.organizationId); }

  @Post('advance-payments')
  createAdvance(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdvancePaymentDto) { return this.service.createAdvancePayment(user.organizationId, dto); }

  @Get('advance-payments')
  findAdvances(@CurrentUser() user: JwtPayload) { return this.service.findAdvancePayments(user.organizationId); }

  @Patch('advance-payments/:id/apply')
  applyAdvance(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('amount') amount: number) { return this.service.applyAdvancePayment(user.organizationId, id, amount); }
}
