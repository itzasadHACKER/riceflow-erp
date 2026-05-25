import { Module } from '@nestjs/common';
import { ExportSalesService } from './export-sales.service';
import { ExportSalesController } from './export-sales.controller';

@Module({
  controllers: [ExportSalesController],
  providers: [ExportSalesService],
  exports: [ExportSalesService],
})
export class ExportSalesModule {}
