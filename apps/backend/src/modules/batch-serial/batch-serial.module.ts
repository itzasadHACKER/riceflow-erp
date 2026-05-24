import { Module } from '@nestjs/common';
import { BatchSerialController } from './batch-serial.controller';
import { BatchSerialService } from './batch-serial.service';

@Module({
  controllers: [BatchSerialController],
  providers: [BatchSerialService],
  exports: [BatchSerialService],
})
export class BatchSerialModule {}
