import { Module } from '@nestjs/common';
import { PaymentWizardController } from './payment-wizard.controller';
import { PaymentWizardService } from './payment-wizard.service';

@Module({ controllers: [PaymentWizardController], providers: [PaymentWizardService], exports: [PaymentWizardService] })
export class PaymentWizardModule {}
