import { Module } from '@nestjs/common';
import { FinancialPeriodController } from './financial-period.controller';
import { FinancialPeriodService } from './financial-period.service';

@Module({ controllers: [FinancialPeriodController], providers: [FinancialPeriodService], exports: [FinancialPeriodService] })
export class FinancialPeriodModule {}
