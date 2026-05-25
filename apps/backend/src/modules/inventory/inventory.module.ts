import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryEnhancedService } from './inventory-enhanced.service';
import { InventoryEnhancedController } from './inventory-enhanced.controller';
import { AccountingEngineModule } from '../accounting-engine/accounting-engine.module';

@Module({
  imports: [AccountingEngineModule],
  controllers: [InventoryController, InventoryEnhancedController],
  providers: [InventoryService, InventoryEnhancedService],
  exports: [InventoryService, InventoryEnhancedService],
})
export class InventoryModule {}
