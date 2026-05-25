import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { GeneralLedgerService } from './general-ledger.service';
import { StockLedgerService } from './stock-ledger.service';
import { PaymentEntryService } from './payment-entry.service';
import { DocumentLifecycleService } from './document-lifecycle.service';
import { AccountingEngineController } from './accounting-engine.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingEngineController],
  providers: [
    GeneralLedgerService,
    StockLedgerService,
    PaymentEntryService,
    DocumentLifecycleService,
  ],
  exports: [
    GeneralLedgerService,
    StockLedgerService,
    PaymentEntryService,
    DocumentLifecycleService,
  ],
})
export class AccountingEngineModule {}
