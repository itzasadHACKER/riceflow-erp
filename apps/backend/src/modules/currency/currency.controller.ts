import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { CurrencyService } from './currency.service';
import { CreateCurrencyDto, CreateExchangeRateDto } from './dto/currency.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Currency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('currencies')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post()
  @ApiOperation({ summary: 'Create currency' })
  async createCurrency(@CurrentUser() user: JwtPayload, @Body() dto: CreateCurrencyDto) {
    const result = await this.currencyService.createCurrency(user.organizationId, dto);
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List currencies' })
  async getCurrencies(@CurrentUser() user: JwtPayload) {
    const result = await this.currencyService.getCurrencies(user.organizationId);
    return createResponse(result);
  }

  @Post('exchange-rates')
  @ApiOperation({ summary: 'Add exchange rate' })
  async addExchangeRate(@CurrentUser() user: JwtPayload, @Body() dto: CreateExchangeRateDto) {
    const result = await this.currencyService.addExchangeRate(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Get exchange rates' })
  async getExchangeRates(@CurrentUser() user: JwtPayload, @Query('currencyId') currencyId?: string) {
    const result = await this.currencyService.getExchangeRates(user.organizationId, currencyId);
    return createResponse(result);
  }

  @Get('convert')
  @ApiOperation({ summary: 'Convert currency' })
  async convert(
    @CurrentUser() user: JwtPayload,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('amount') amount: string,
  ) {
    const result = await this.currencyService.convert(user.organizationId, from, to, amount);
    return createResponse(result);
  }
}
