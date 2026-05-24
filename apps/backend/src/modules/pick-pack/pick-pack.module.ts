import { Module } from '@nestjs/common';
import { PickPackController } from './pick-pack.controller';
import { PickPackService } from './pick-pack.service';

@Module({ controllers: [PickPackController], providers: [PickPackService], exports: [PickPackService] })
export class PickPackModule {}
