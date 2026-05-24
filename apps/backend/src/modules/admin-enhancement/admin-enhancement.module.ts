import { Module } from '@nestjs/common';
import { AdminEnhancementController } from './admin-enhancement.controller';
import { AdminEnhancementService } from './admin-enhancement.service';

@Module({ controllers: [AdminEnhancementController], providers: [AdminEnhancementService], exports: [AdminEnhancementService] })
export class AdminEnhancementModule {}
