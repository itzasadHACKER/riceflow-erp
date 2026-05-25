import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentModeEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  ONLINE = 'ONLINE',
  WIRE_TRANSFER = 'WIRE_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
}

// ============================================================================
// PAYMENT VOUCHER DTOs
// ============================================================================

export class CreatePaymentVoucherDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: 'SUPPLIER' })
  @IsString()
  partyType: string;

  @ApiProperty()
  @IsUUID()
  partyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

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
  @IsUUID()
  paidFromAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paidToAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @ApiPropertyOptional({ description: 'Currency (default PKR)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional({ description: 'Letter head for print' })
  @IsOptional()
  @IsString()
  letterHead?: string;

  @ApiPropertyOptional({ description: 'Deductions (e.g., withholding tax)' })
  @IsOptional()
  @IsArray()
  deductions?: any[];
}

export class CreateReceiptVoucherDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postingTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: 'CUSTOMER' })
  @IsString()
  partyType: string;

  @ApiProperty()
  @IsUUID()
  partyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyName?: string;

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
  @IsUUID()
  paidFromAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  paidToAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  chequeDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================================
// BANK ACCOUNT DTOs
// ============================================================================

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
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'SWIFT code for international transfers' })
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional({ description: 'Bank guarantee limit' })
  @IsOptional()
  @IsNumber()
  bankGuaranteeLimit?: number;

  @ApiPropertyOptional({ description: 'Account currency' })
  @IsOptional()
  @IsString()
  accountCurrency?: string;

  @ApiPropertyOptional({ description: 'Bank account type: Current, Savings, etc.' })
  @IsOptional()
  @IsString()
  bankAccountType?: string;

  @ApiPropertyOptional({ description: 'Last integration date' })
  @IsOptional()
  @IsDateString()
  lastIntegrationDate?: string;

  @ApiPropertyOptional({ description: 'Integration ID for bank feeds' })
  @IsOptional()
  @IsString()
  integrationId?: string;

  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional({ description: 'Is company account' })
  @IsOptional()
  @IsBoolean()
  isCompanyAccount?: boolean;

  @ApiPropertyOptional({ description: 'Is default bank account' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
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
  branchName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  swiftCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bankGuaranteeLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

// ============================================================================
// TAX CONFIG DTOs
// ============================================================================

export class TaxLineItemDto {
  @ApiProperty({ example: 'GST' })
  @IsString()
  taxType: string;

  @ApiPropertyOptional({ description: 'Description of charge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 17 })
  @IsNumber()
  rate: number;

  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiPropertyOptional({ description: 'Charge type: On Net Total, On Previous Row Amount, etc.' })
  @IsOptional()
  @IsString()
  chargeType?: string;

  @ApiPropertyOptional({ description: 'Row ID to reference (for cascading taxes)' })
  @IsOptional()
  @IsNumber()
  rowId?: number;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Include in print' })
  @IsOptional()
  @IsBoolean()
  includedInPrintRate?: boolean;

  @ApiPropertyOptional({ description: 'Include in valuation' })
  @IsOptional()
  @IsBoolean()
  includedInPaidAmount?: boolean;
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

  @ApiPropertyOptional({ description: 'Tax template title for display' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Is this the default tax template' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Tax category' })
  @IsOptional()
  @IsString()
  taxCategory?: string;

  @ApiPropertyOptional({ description: 'Detailed tax breakdown rows' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxLineItemDto)
  taxes?: TaxLineItemDto[];
}

// ============================================================================
// EXPENSE CLAIM DTOs
// ============================================================================

export class ExpenseItemDto {
  @ApiProperty({ example: 'Travel' })
  @IsString()
  expenseType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sanctionedAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  expenseAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

export class CreateExpenseClaimDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Expense claim type' })
  @IsOptional()
  @IsString()
  expenseType?: string;

  @ApiPropertyOptional({ description: 'Payable account for expense' })
  @IsOptional()
  @IsUUID()
  payableAccountId?: string;

  @ApiPropertyOptional({ description: 'Cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Approval status' })
  @IsOptional()
  @IsString()
  approvalStatus?: string;

  @ApiPropertyOptional({ description: 'Is paid by company' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'Detailed expense line items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDto)
  expenses?: ExpenseItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ============================================================================
// LEDGER & REPORT FILTER DTOs
// ============================================================================

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

  @ApiPropertyOptional({ description: 'Filter by party type' })
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional({ description: 'Filter by party ID' })
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional({ description: 'Filter by cost center' })
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional({ description: 'Filter by project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Group by party' })
  @IsOptional()
  @IsBoolean()
  groupByParty?: boolean;

  @ApiPropertyOptional({ description: 'Group by voucher' })
  @IsOptional()
  @IsBoolean()
  groupByVoucher?: boolean;

  @ApiPropertyOptional({ description: 'Include opening entries' })
  @IsOptional()
  @IsBoolean()
  includeOpening?: boolean;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Show zero balance accounts' })
  @IsOptional()
  @IsBoolean()
  showZeroBalances?: boolean;

  @ApiPropertyOptional({ description: 'Group by account type' })
  @IsOptional()
  @IsBoolean()
  groupByAccountType?: boolean;
}
