import { Module } from '@nestjs/common';
import { AdminEnhancementController } from './admin-enhancement.controller';
import { AdminEnhancementService } from './admin-enhancement.service';
import { AdminEnhancedController } from './admin-enhanced.controller';
import { AdminEnhancedService } from './admin-enhanced.service';

@Module({
  controllers: [AdminEnhancementController, AdminEnhancedController],
  providers: [AdminEnhancementService, AdminEnhancedService],
  exports: [AdminEnhancementService, AdminEnhancedService],
})
export class AdminEnhancementModule {}
