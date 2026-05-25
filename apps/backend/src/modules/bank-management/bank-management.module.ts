import { Module } from '@nestjs/common';
import { BankManagementController } from './bank-management.controller';
import { BankManagementService } from './bank-management.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BankManagementController],
  providers: [BankManagementService],
  exports: [BankManagementService],
})
export class BankManagementModule {}
