import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SalesEnhancedService } from './sales-enhanced.service';
import { SalesEnhancedController } from './sales-enhanced.controller';
import { AccountingEngineModule } from '../accounting-engine/accounting-engine.module';

@Module({
  imports: [AccountingEngineModule],
  controllers: [SalesController, SalesEnhancedController],
  providers: [SalesService, SalesEnhancedService],
  exports: [SalesService, SalesEnhancedService],
})
export class SalesModule {}
