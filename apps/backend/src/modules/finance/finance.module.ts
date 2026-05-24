import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceEnhancedService } from './finance-enhanced.service';
import { FinanceEnhancedController } from './finance-enhanced.controller';

@Module({
  controllers: [FinanceController, FinanceEnhancedController],
  providers: [FinanceService, FinanceEnhancedService],
  exports: [FinanceService, FinanceEnhancedService],
})
export class FinanceModule {}
