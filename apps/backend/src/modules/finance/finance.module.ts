import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceEnhancedService } from './finance-enhanced.service';
import { FinanceEnhancedController } from './finance-enhanced.controller';
import { AccountingEngineService } from './accounting-engine.service';
import { AccountingEngineController } from './accounting-engine.controller';
import { PdfReportService } from './pdf-report.service';
import { PdfReportController } from './pdf-report.controller';

@Module({
  controllers: [FinanceController, FinanceEnhancedController, AccountingEngineController, PdfReportController],
  providers: [FinanceService, FinanceEnhancedService, AccountingEngineService, PdfReportService],
  exports: [FinanceService, FinanceEnhancedService, AccountingEngineService, PdfReportService],
})
export class FinanceModule {}
