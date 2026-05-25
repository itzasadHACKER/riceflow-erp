import { Module } from '@nestjs/common';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { AccountingEngineModule } from '../accounting-engine/accounting-engine.module';

@Module({
  imports: [AccountingEngineModule],
  controllers: [ProcurementController],
  providers: [ProcurementService],
  exports: [ProcurementService],
})
export class ProcurementModule {}
