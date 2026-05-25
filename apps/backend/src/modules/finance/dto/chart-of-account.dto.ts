import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum BalanceTypeEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export class CreateChartOfAccountDto {
  @ApiProperty({ example: '1000' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Cash in Hand' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountTypeEnum })
  @IsEnum(AccountTypeEnum)
  accountType: AccountTypeEnum;

  @ApiPropertyOptional({ description: 'Sub-type: Cash, Bank, Receivable, Payable, Stock, Tax, Cost of Goods Sold, etc.' })
  @IsOptional()
  @IsString()
  accountSubType?: string;

  @ApiProperty({ enum: BalanceTypeEnum })
  @IsEnum(BalanceTypeEnum)
  balanceType: BalanceTypeEnum;

  @ApiPropertyOptional({ description: 'Root type for financial statement grouping' })
  @IsOptional()
  @IsString()
  rootType?: string;

  @ApiPropertyOptional({ description: 'Report type: Balance Sheet or Profit and Loss' })
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Frozen account — no new entries allowed' })
  @IsOptional()
  @IsBoolean()
  isFrozen?: boolean;

  @ApiPropertyOptional({ description: 'Account currency (defaults to PKR)' })
  @IsOptional()
  @IsString()
  accountCurrency?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional({ description: 'Opening debit balance' })
  @IsOptional()
  @IsNumber()
  openingDebit?: number;

  @ApiPropertyOptional({ description: 'Opening credit balance' })
  @IsOptional()
  @IsNumber()
  openingCredit?: number;

  @ApiPropertyOptional({ description: 'Allowed party types (e.g., Customer, Supplier, Employee)' })
  @IsOptional()
  @IsString()
  allowedPartyTypes?: string;

  @ApiPropertyOptional({ description: 'Cost center is mandatory for entries' })
  @IsOptional()
  @IsBoolean()
  mandatoryCostCenter?: boolean;

  @ApiPropertyOptional({ description: 'Include in gross profit calculation' })
  @IsOptional()
  @IsBoolean()
  includeInGrossProfit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultCostCenterId?: string;

  @ApiPropertyOptional({ description: 'Tax rate for this account (if applicable)' })
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateChartOfAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountSubType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFrozen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  allowedPartyTypes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  mandatoryCostCenter?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeInGrossProfit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  defaultCostCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
