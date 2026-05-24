import { Module } from '@nestjs/common';
import { PurchaseEnhancementController } from './purchase-enhancement.controller';
import { PurchaseEnhancementService } from './purchase-enhancement.service';

@Module({
  controllers: [PurchaseEnhancementController],
  providers: [PurchaseEnhancementService],
  exports: [PurchaseEnhancementService],
})
export class PurchaseEnhancementModule {}
