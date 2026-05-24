import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateCurrencyDto, CreateExchangeRateDto } from './dto/currency.dto';

@Injectable()
export class CurrencyService {
  constructor(private readonly prisma: PrismaService) {}

  async createCurrency(organizationId: string, dto: CreateCurrencyDto) {
    if (dto.isBaseCurrency) {
      const existing = await this.prisma.currency.findFirst({
        where: { organizationId, isBaseCurrency: true },
      });
      if (existing) throw new BadRequestException('Base currency already set. Update existing first.');
    }
    return this.prisma.currency.create({
      data: {
        organizationId,
        code: dto.code.toUpperCase(),
        name: dto.name,
        symbol: dto.symbol,
        decimalPlaces: dto.decimalPlaces ?? 2,
        isBaseCurrency: dto.isBaseCurrency ?? false,
      },
    });
  }

  async getCurrencies(organizationId: string) {
    return this.prisma.currency.findMany({
      where: { organizationId, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async addExchangeRate(organizationId: string, dto: CreateExchangeRateDto) {
    return this.prisma.exchangeRate.create({
      data: {
        organizationId,
        currencyId: dto.currencyId,
        rate: new Prisma.Decimal(dto.rate),
        effectiveDate: new Date(dto.effectiveDate),
        source: dto.source,
      },
    });
  }

  async getExchangeRates(organizationId: string, currencyId?: string) {
    const where: Prisma.ExchangeRateWhereInput = { organizationId };
    if (currencyId) where.currencyId = currencyId;
    return this.prisma.exchangeRate.findMany({
      where,
      include: { currency: true },
      orderBy: { effectiveDate: 'desc' },
      take: 100,
    });
  }

  async getLatestRate(organizationId: string, currencyId: string) {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { organizationId, currencyId },
      orderBy: { effectiveDate: 'desc' },
      include: { currency: true },
    });
    if (!rate) throw new NotFoundException('No exchange rate found for this currency');
    return rate;
  }

  async convert(organizationId: string, fromCurrencyId: string, toCurrencyId: string, amount: string) {
    const fromRate = await this.prisma.exchangeRate.findFirst({
      where: { organizationId, currencyId: fromCurrencyId },
      orderBy: { effectiveDate: 'desc' },
    });
    const toRate = await this.prisma.exchangeRate.findFirst({
      where: { organizationId, currencyId: toCurrencyId },
      orderBy: { effectiveDate: 'desc' },
    });

    const fromRateValue = fromRate ? Number(fromRate.rate) : 1;
    const toRateValue = toRate ? Number(toRate.rate) : 1;
    const amountInBase = parseFloat(amount) / fromRateValue;
    const convertedAmount = amountInBase * toRateValue;

    return {
      originalAmount: parseFloat(amount),
      fromCurrencyId,
      toCurrencyId,
      fromRate: fromRateValue,
      toRate: toRateValue,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
    };
  }
}
