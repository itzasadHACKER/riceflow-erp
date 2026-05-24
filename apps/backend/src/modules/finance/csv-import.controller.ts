import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('csv-import')
@UseGuards(JwtAuthGuard)
export class CsvImportController {
  constructor(private readonly csvImport: CsvImportService) {}

  @Post('customers')
  importCustomers(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv: string },
  ) {
    return this.csvImport.importCustomersCsv(orgId, body.csv);
  }

  @Post('suppliers')
  importSuppliers(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv: string },
  ) {
    return this.csvImport.importSuppliersCsv(orgId, body.csv);
  }

  @Post('items')
  importItems(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv: string },
  ) {
    return this.csvImport.importItemsCsv(orgId, body.csv);
  }

  @Post('opening-balances')
  importOpeningBalances(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv: string },
  ) {
    return this.csvImport.importOpeningBalancesCsv(orgId, body.csv);
  }

  @Post('party-balances')
  importPartyBalances(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { csv: string; partyType: 'customer' | 'supplier' },
  ) {
    return this.csvImport.importPartyBalancesCsv(orgId, body.csv, body.partyType);
  }

  @Get('sample')
  getSampleCsv(
    @Query('type') type: 'customers' | 'suppliers' | 'items' | 'opening_balances' | 'party_balances',
  ) {
    return { csv: this.csvImport.getSampleCsv(type) };
  }
}
