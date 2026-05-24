import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { FinanceEnhancedService } from './finance-enhanced.service';
import { FinanceEnhancedController } from './finance-enhanced.controller';
import { AccountingEngineService } from './accounting-engine.service';
import { AccountingEngineController } from './accounting-engine.controller';
import { PdfReportService } from './pdf-report.service';
import { PdfReportController } from './pdf-report.controller';
import { CsvImportService } from './csv-import.service';
import { CsvImportController } from './csv-import.controller';
import { Phase1CoreService } from './phase1-core.service';
import { Phase1CoreController } from './phase1-core.controller';

@Module({
  controllers: [FinanceController, FinanceEnhancedController, AccountingEngineController, PdfReportController, CsvImportController, Phase1CoreController],
  providers: [FinanceService, FinanceEnhancedService, AccountingEngineService, PdfReportService, CsvImportService, Phase1CoreService],
  exports: [FinanceService, FinanceEnhancedService, AccountingEngineService, PdfReportService, CsvImportService, Phase1CoreService],
})
export class FinanceModule {}
