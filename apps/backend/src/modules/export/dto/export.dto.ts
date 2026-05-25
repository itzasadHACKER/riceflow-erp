import { IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExportFormatEnum {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

export enum ExportEntityEnum {
  JOURNAL_ENTRIES = 'JOURNAL_ENTRIES',
  TRIAL_BALANCE = 'TRIAL_BALANCE',
  PROFIT_LOSS = 'PROFIT_LOSS',
  BALANCE_SHEET = 'BALANCE_SHEET',
  GENERAL_LEDGER = 'GENERAL_LEDGER',
  SALES_INVOICES = 'SALES_INVOICES',
  PURCHASE_ENTRIES = 'PURCHASE_ENTRIES',
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  EMPLOYEES = 'EMPLOYEES',
  INVENTORY = 'INVENTORY',
  STOCK_MOVEMENTS = 'STOCK_MOVEMENTS',
  EXPENSE_CLAIMS = 'EXPENSE_CLAIMS',
  PAYMENT_VOUCHERS = 'PAYMENT_VOUCHERS',
  RECEIPT_VOUCHERS = 'RECEIPT_VOUCHERS',
  ASSETS = 'ASSETS',
  QUALITY_INSPECTIONS = 'QUALITY_INSPECTIONS',
}

export class ExportRequestDto {
  @ApiProperty({ enum: ExportEntityEnum })
  @IsEnum(ExportEntityEnum)
  entity!: ExportEntityEnum;

  @ApiProperty({ enum: ExportFormatEnum })
  @IsEnum(ExportFormatEnum)
  format!: ExportFormatEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  columns?: string[];
}

export class PrintRequestDto {
  @ApiProperty({
    description: 'Entity type (e.g. SALES_INVOICE, PAYMENT_VOUCHER)',
  })
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsString()
  entityId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;
}
