import { IsOptional, IsString, IsEmail, IsNumber, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Company abbreviation' })
  @IsOptional()
  @IsString()
  abbr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fax?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Sales tax registration number' })
  @IsOptional()
  @IsString()
  salesTaxNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNo?: string;

  @ApiPropertyOptional({ description: 'Date of establishment' })
  @IsOptional()
  @IsString()
  dateOfEstablishment?: string;

  @ApiPropertyOptional({ description: 'Default currency (PKR)' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ description: 'Default payment terms in days' })
  @IsOptional()
  @IsNumber()
  defaultPaymentTermsDays?: number;

  @ApiPropertyOptional({ description: 'Default credit days' })
  @IsOptional()
  @IsNumber()
  defaultCreditDays?: number;

  @ApiPropertyOptional({ description: 'Default warehouse' })
  @IsOptional()
  @IsUUID()
  defaultWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Default cost center' })
  @IsOptional()
  @IsUUID()
  defaultCostCenterId?: string;

  @ApiPropertyOptional({ description: 'Default income account' })
  @IsOptional()
  @IsUUID()
  defaultIncomeAccountId?: string;

  @ApiPropertyOptional({ description: 'Default expense account' })
  @IsOptional()
  @IsUUID()
  defaultExpenseAccountId?: string;

  @ApiPropertyOptional({ description: 'Default payable account' })
  @IsOptional()
  @IsUUID()
  defaultPayableAccountId?: string;

  @ApiPropertyOptional({ description: 'Default receivable account' })
  @IsOptional()
  @IsUUID()
  defaultReceivableAccountId?: string;

  @ApiPropertyOptional({ description: 'Default bank account' })
  @IsOptional()
  @IsUUID()
  defaultBankAccountId?: string;

  @ApiPropertyOptional({ description: 'Default cash account' })
  @IsOptional()
  @IsUUID()
  defaultCashAccountId?: string;

  @ApiPropertyOptional({ description: 'Round-off account' })
  @IsOptional()
  @IsUUID()
  roundOffAccountId?: string;

  @ApiPropertyOptional({ description: 'Write-off account' })
  @IsOptional()
  @IsUUID()
  writeOffAccountId?: string;

  @ApiPropertyOptional({ description: 'Exchange gain/loss account' })
  @IsOptional()
  @IsUUID()
  exchangeGainLossAccountId?: string;

  @ApiPropertyOptional({ description: 'Stock received but not billed account' })
  @IsOptional()
  @IsUUID()
  stockReceivedNotBilledId?: string;

  @ApiPropertyOptional({ description: 'Stock adjustment account' })
  @IsOptional()
  @IsUUID()
  stockAdjustmentAccountId?: string;

  @ApiPropertyOptional({ description: 'Default inventory account' })
  @IsOptional()
  @IsUUID()
  defaultInventoryAccountId?: string;

  @ApiPropertyOptional({ description: 'COGS account' })
  @IsOptional()
  @IsUUID()
  cogsAccountId?: string;

  @ApiPropertyOptional({ description: 'Round-off cost center' })
  @IsOptional()
  @IsUUID()
  roundOffCostCenterId?: string;

  @ApiPropertyOptional({ description: 'Enable perpetual inventory' })
  @IsOptional()
  @IsBoolean()
  enablePerpetualInventory?: boolean;

  @ApiPropertyOptional({ description: 'Valuation method: MOVING_AVERAGE or FIFO' })
  @IsOptional()
  @IsString()
  valuationMethod?: string;

  @ApiPropertyOptional({ description: 'Auto accounting for stock entry' })
  @IsOptional()
  @IsBoolean()
  autoAccountingForStockEntry?: boolean;

  @ApiPropertyOptional({ description: 'Auto journal entry creation' })
  @IsOptional()
  @IsBoolean()
  enableAutoJournalEntry?: boolean;
}
