import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { MarketIntelligenceService } from './market-intelligence.service';
import { CreateMarketRateDto } from './dto/market.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Market Intelligence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('market')
export class MarketIntelligenceController {
  constructor(private readonly marketService: MarketIntelligenceService) {}

  @Post('rates')
  @ApiOperation({ summary: 'Add market rate' })
  async createRate(@CurrentUser() user: JwtPayload, @Body() dto: CreateMarketRateDto) {
    const result = await this.marketService.createRate(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get market rates' })
  async getRates(
    @CurrentUser() user: JwtPayload,
    @Query('commodityType') commodityType?: string,
    @Query('market') market?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.marketService.getRates(user.organizationId, commodityType, market, startDate, endDate);
    return createResponse(result);
  }

  @Get('rates/latest')
  @ApiOperation({ summary: 'Get latest market rates' })
  async getLatestRates(@CurrentUser() user: JwtPayload, @Query('commodityType') commodityType?: string) {
    const result = await this.marketService.getLatestRates(user.organizationId, commodityType);
    return createResponse(result);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get price trend for commodity' })
  async getPriceTrend(
    @CurrentUser() user: JwtPayload,
    @Query('commodity') commodity: string,
    @Query('market') market: string,
    @Query('days') days?: string,
  ) {
    const result = await this.marketService.getPriceTrend(
      user.organizationId,
      commodity,
      market,
      parseInt(days ?? '30', 10),
    );
    return createResponse(result);
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Compare prices across markets' })
  async getMarketComparison(@CurrentUser() user: JwtPayload, @Query('commodity') commodity: string) {
    const result = await this.marketService.getMarketComparison(user.organizationId, commodity);
    return createResponse(result);
  }
}
