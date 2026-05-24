import { Module } from '@nestjs/common';
import { SetupWizardController } from './setup-wizard.controller';
import { SetupWizardService } from './setup-wizard.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SetupWizardController],
  providers: [SetupWizardService],
  exports: [SetupWizardService],
})
export class SetupWizardModule {}
