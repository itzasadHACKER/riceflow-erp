import { Module } from '@nestjs/common';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { ProductionAnalyticsService } from './production-analytics.service';
import { ProductionAnalyticsController } from './production-analytics.controller';

@Module({
  controllers: [ProductionController, ProductionAnalyticsController],
  providers: [ProductionService, ProductionAnalyticsService],
  exports: [ProductionService, ProductionAnalyticsService],
})
export class ProductionModule {}
