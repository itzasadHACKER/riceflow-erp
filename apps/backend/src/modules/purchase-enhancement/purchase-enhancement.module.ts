import { Module } from '@nestjs/common';
import { PurchaseEnhancementController } from './purchase-enhancement.controller';
import { PurchaseEnhancementService } from './purchase-enhancement.service';
import { PurchaseEnhancedController } from './purchase-enhanced.controller';
import { PurchaseEnhancedService } from './purchase-enhanced.service';

@Module({
  controllers: [PurchaseEnhancementController, PurchaseEnhancedController],
  providers: [PurchaseEnhancementService, PurchaseEnhancedService],
  exports: [PurchaseEnhancementService, PurchaseEnhancedService],
})
export class PurchaseEnhancementModule {}
