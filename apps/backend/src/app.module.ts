import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HrModule } from './modules/hr/hr.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { ProductionModule } from './modules/production/production.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { TransportModule } from './modules/transport/transport.module';
import { CrmModule } from './modules/crm/crm.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    UserModule,
    HealthModule,
    FinanceModule,
    HrModule,
    ProcurementModule,
    ProductionModule,
    InventoryModule,
    SalesModule,
    TransportModule,
    CrmModule,
    ReportingModule,
    SettingsModule,
  ],
})
export class AppModule {}
