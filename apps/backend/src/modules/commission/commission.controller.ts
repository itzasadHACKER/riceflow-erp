import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { CommissionService } from './commission.service';
import { CreateCommissionRuleDto, CreateCommissionEntryDto, CreateSettlementDto } from './dto/commission.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Commission & Settlement')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Post('rules')
  @ApiOperation({ summary: 'Create commission rule' })
  async createRule(@CurrentUser() user: JwtPayload, @Body() dto: CreateCommissionRuleDto) {
    const result = await this.commissionService.createRule(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('rules')
  @ApiOperation({ summary: 'List commission rules' })
  async getRules(@CurrentUser() user: JwtPayload) {
    const result = await this.commissionService.getRules(user.organizationId);
    return createResponse(result);
  }

  @Post('entries')
  @ApiOperation({ summary: 'Create commission entry' })
  async createEntry(@CurrentUser() user: JwtPayload, @Body() dto: CreateCommissionEntryDto) {
    const result = await this.commissionService.createEntry(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List commission entries' })
  async getEntries(@CurrentUser() user: JwtPayload, @Query('partyId') partyId?: string) {
    const result = await this.commissionService.getEntries(user.organizationId, partyId);
    return createResponse(result);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending commissions' })
  async getPending(@CurrentUser() user: JwtPayload, @Query('partyId') partyId?: string) {
    const result = await this.commissionService.getPendingCommissions(user.organizationId, partyId);
    return createResponse(result);
  }

  @Get('calculate')
  @ApiOperation({ summary: 'Calculate commission for a transaction' })
  async calculate(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType: string,
    @Query('amount') amount: string,
  ) {
    const result = await this.commissionService.calculateCommission(user.organizationId, entityType, amount);
    return createResponse(result);
  }

  @Post('settlements')
  @ApiOperation({ summary: 'Create settlement' })
  async createSettlement(@CurrentUser() user: JwtPayload, @Body() dto: CreateSettlementDto) {
    const result = await this.commissionService.createSettlement(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('settlements')
  @ApiOperation({ summary: 'List settlements' })
  async getSettlements(@CurrentUser() user: JwtPayload, @Query('partyId') partyId?: string) {
    const result = await this.commissionService.getSettlements(user.organizationId, partyId);
    return createResponse(result);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get commission summary by party' })
  async getSummary(@CurrentUser() user: JwtPayload) {
    const result = await this.commissionService.getCommissionSummary(user.organizationId);
    return createResponse(result);
  }
}
