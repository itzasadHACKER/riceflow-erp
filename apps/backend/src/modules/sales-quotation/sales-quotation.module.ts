import { Module } from '@nestjs/common';
import { SalesQuotationController } from './sales-quotation.controller';
import { SalesQuotationService } from './sales-quotation.service';

@Module({
  controllers: [SalesQuotationController],
  providers: [SalesQuotationService],
  exports: [SalesQuotationService],
})
export class SalesQuotationModule {}
