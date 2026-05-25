import { Module } from '@nestjs/common';
import { GatePassService } from './gate-pass.service';
import { GatePassController } from './gate-pass.controller';

@Module({
  controllers: [GatePassController],
  providers: [GatePassService],
  exports: [GatePassService],
})
export class GatePassModule {}
