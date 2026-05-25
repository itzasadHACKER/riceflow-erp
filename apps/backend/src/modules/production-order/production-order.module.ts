import { Module } from '@nestjs/common';
import { ProductionOrderController } from './production-order.controller';
import { ProductionOrderService } from './production-order.service';
import { ProductionEnhancedController } from './production-enhanced.controller';
import { ProductionEnhancedService } from './production-enhanced.service';

@Module({
  controllers: [ProductionOrderController, ProductionEnhancedController],
  providers: [ProductionOrderService, ProductionEnhancedService],
  exports: [ProductionOrderService, ProductionEnhancedService],
})
export class ProductionOrderModule {}
