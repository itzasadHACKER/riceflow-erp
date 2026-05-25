import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JournalEntryTypeEnum {
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
  ADJUSTMENT = 'ADJUSTMENT',
  OPENING = 'OPENING',
  DEPRECIATION = 'DEPRECIATION',
  WRITE_OFF = 'WRITE_OFF',
  EXCHANGE_GAIN_LOSS = 'EXCHANGE_GAIN_LOSS',
  DEFERRED_REVENUE = 'DEFERRED_REVENUE',
  DEFERRED_EXPENSE = 'DEFERRED_EXPENSE',
  INTER_COMPANY = 'INTER_COMPANY',
  BANK_ENTRY = 'BANK_ENTRY',
  CASH_ENTRY = 'CASH_ENTRY',
  CREDIT_CARD_ENTRY = 'CREDIT_CARD_ENTRY',
  CONTRA_ENTRY = 'CONTRA_ENTRY',
  EXCISE_ENTRY = 'EXCISE_ENTRY',
}

export class JournalEntryLineDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Account code (for display)' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ description: 'Account name (for display)' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional({ description: 'Debit in account currency (for multi-currency)' })
  @IsOptional()
  @IsNumber()
  debitInAccountCurrency?: number;

  @ApiPropertyOptional({ description: 'Credit in account currency (for multi-currency)' })
  @IsOptional()
  @IsNumber()
  creditInAccountCurrency?: number;

  @ApiPropertyOptional({ description: 'Exchange rate for account currency' })
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional({ description: 'Account currency' })
  @IsOptional()
  @IsString()
  accountCurrency?: string;

  @ApiPropertyOptional({ description: 'Party type: Customer, Supplier, Employee' })
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional({ description: 'Party ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Party name (denormalized)' })
  @IsOptional()
  @IsString()
  partyName?: string;

  @ApiPropertyOptional({ description: 'Against account (for double-entry reference)' })
  @IsOptional()
  @IsString()
  againstAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Is advance payment' })
  @IsOptional()
  @IsBoolean()
  isAdvance?: boolean;

  @ApiPropertyOptional({ description: 'Reference document type (e.g., Sales Invoice, Purchase Invoice)' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference document ID' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference document name/number' })
  @IsOptional()
  @IsString()
  referenceName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional({ description: 'Row order index' })
  @IsOptional()
  @IsNumber()
  idx?: number;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ description: 'Posting time (HH:mm:ss)' })
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional({ description: 'Naming series for auto-numbering' })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional({ description: 'Cheque/reference number' })
  @IsOptional()
  @IsString()
  chequeNo?: string;

  @ApiPropertyOptional({ description: 'Cheque/reference date' })
  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @ApiPropertyOptional({ description: 'User remark' })
  @IsOptional()
  @IsString()
  userRemark?: string;

  @ApiPropertyOptional({ enum: JournalEntryTypeEnum, default: 'MANUAL' })
  @IsOptional()
  @IsEnum(JournalEntryTypeEnum)
  entryType?: JournalEntryTypeEnum;

  @ApiProperty()
  @IsUUID()
  fiscalYearId: string;

  @ApiPropertyOptional({ description: 'Bill number for matching' })
  @IsOptional()
  @IsString()
  billNo?: string;

  @ApiPropertyOptional({ description: 'Bill date' })
  @IsOptional()
  @IsDateString()
  billDate?: string;

  @ApiPropertyOptional({ description: 'Total debit (calculated, can be provided for validation)' })
  @IsOptional()
  @IsNumber()
  totalDebit?: number;

  @ApiPropertyOptional({ description: 'Total credit (calculated, can be provided for validation)' })
  @IsOptional()
  @IsNumber()
  totalCredit?: number;

  @ApiPropertyOptional({ description: 'Difference amount (should be 0 for balanced entry)' })
  @IsOptional()
  @IsNumber()
  differenceAmount?: number;

  @ApiPropertyOptional({ description: 'Multi-currency journal entry' })
  @IsOptional()
  @IsBoolean()
  multiCurrency?: boolean;

  @ApiPropertyOptional({ description: 'Is opening entry' })
  @IsOptional()
  @IsBoolean()
  isOpeningEntry?: boolean;

  @ApiPropertyOptional({ description: 'Letter head for print' })
  @IsOptional()
  @IsString()
  letterHead?: string;

  @ApiPropertyOptional({ description: 'Write-off based on' })
  @IsOptional()
  @IsString()
  writeOffBasedOn?: string;

  @ApiPropertyOptional({ description: 'Write-off amount' })
  @IsOptional()
  @IsNumber()
  writeOffAmount?: number;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class PostJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class JournalEntryFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ enum: JournalEntryTypeEnum })
  @IsOptional()
  @IsEnum(JournalEntryTypeEnum)
  entryType?: JournalEntryTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  isPosted?: boolean;

  @ApiPropertyOptional({ description: 'Filter by party type' })
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional({ description: 'Filter by party ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Filter by reference number' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Is opening entry' })
  @IsOptional()
  @IsBoolean()
  isOpeningEntry?: boolean;
}
