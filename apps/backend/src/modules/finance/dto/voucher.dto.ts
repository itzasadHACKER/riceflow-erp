import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentModeEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
}

export class CreatePaymentVoucherDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'SUPPLIER' })
  @IsString()
  partyType: string;

  @ApiProperty()
  @IsUUID()
  partyId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentModeEnum })
  @IsEnum(PaymentModeEnum)
  paymentMode: PaymentModeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateReceiptVoucherDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 'CUSTOMER' })
  @IsString()
  partyType: string;

  @ApiProperty()
  @IsUUID()
  partyId: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: PaymentModeEnum })
  @IsEnum(PaymentModeEnum)
  paymentMode: PaymentModeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateBankAccountDto {
  @ApiProperty({ example: 'Main Operating Account' })
  @IsString()
  accountName: string;

  @ApiProperty({ example: 'HBL' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: '1234567890' })
  @IsString()
  accountNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}

export class UpdateBankAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

export class CreateTaxConfigDto {
  @ApiProperty({ example: 'GST' })
  @IsString()
  name: string;

  @ApiProperty({ example: 17 })
  @IsNumber()
  rate: number;

  @ApiProperty({ example: 'OUTPUT' })
  @IsString()
  taxType: string;

  @ApiProperty()
  @IsUUID()
  accountId: string;
}

export class CreateExpenseClaimDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class LedgerFilterDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class TrialBalanceFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;
}
