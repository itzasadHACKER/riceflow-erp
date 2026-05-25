import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsUUID, IsEnum, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class GLEntryLineDto {
  @IsUUID()
  accountId: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  debit: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  credit: number;

  @IsOptional()
  @IsString()
  againstAccount?: string;

  @IsOptional()
  @IsString()
  partyType?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsString()
  partyName?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsBoolean()
  isAdvance?: boolean;

  @IsOptional()
  @IsString()
  accountCurrency?: string;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsNumber()
  debitInAccountCurrency?: number;

  @IsOptional()
  @IsNumber()
  creditInAccountCurrency?: number;

  @IsOptional()
  @IsString()
  againstVoucherType?: string;

  @IsOptional()
  @IsUUID()
  againstVoucherId?: string;
}

export class PostToLedgerDto {
  @IsString()
  voucherType: string;

  @IsString()
  voucherNo: string;

  @IsUUID()
  voucherId: string;

  @IsDateString()
  postingDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => GLEntryLineDto)
  entries: GLEntryLineDto[];

  @IsOptional()
  @IsBoolean()
  isOpening?: boolean;

  @IsOptional()
  @IsUUID()
  journalEntryId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ReverseLedgerDto {
  @IsString()
  voucherType: string;

  @IsString()
  voucherNo: string;

  @IsUUID()
  voucherId: string;

  @IsDateString()
  reversalDate: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class GLReportFilterDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsString()
  partyType?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

  @IsOptional()
  @IsString()
  voucherType?: string;

  @IsOptional()
  @IsBoolean()
  groupByAccount?: boolean;

  @IsOptional()
  @IsBoolean()
  groupByParty?: boolean;

  @IsOptional()
  @IsBoolean()
  groupByVoucher?: boolean;

  @IsOptional()
  @IsBoolean()
  includeCancelled?: boolean;
}

export class StockLedgerPostDto {
  @IsUUID()
  riceVarietyId: string;

  @IsUUID()
  warehouseId: string;

  @IsNumber()
  actualQty: number;

  @IsNumber()
  incomingRate: number;

  @IsString()
  voucherType: string;

  @IsString()
  voucherNo: string;

  @IsUUID()
  voucherId: string;

  @IsDateString()
  postingDate: string;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  serialNo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BalanceSheetFilterDto {
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}

export class ProfitLossFilterDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;

  @IsOptional()
  @IsString()
  fiscalYear?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;
}

export class CashFlowFilterDto {
  @IsDateString()
  fromDate: string;

  @IsDateString()
  toDate: string;
}

export class AgingFilterDto {
  @IsString()
  partyType: string;

  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;
}

export class PaymentEntryDto {
  @IsEnum(['RECEIVE', 'PAY', 'INTERNAL_TRANSFER'])
  paymentType: string;

  @IsDateString()
  postingDate: string;

  @IsOptional()
  @IsString()
  partyType?: string;

  @IsOptional()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsString()
  partyName?: string;

  @IsUUID()
  paidFromAccountId: string;

  @IsUUID()
  paidToAccountId: string;

  @IsNumber()
  paidAmount: number;

  @IsNumber()
  receivedAmount: number;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsDateString()
  referenceDate?: string;

  @IsOptional()
  @IsString()
  modeOfPayment?: string;

  @IsOptional()
  @IsUUID()
  costCenterId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentReferenceDto)
  references?: PaymentReferenceDto[];
}

export class PaymentReferenceDto {
  @IsString()
  referenceDocType: string;

  @IsUUID()
  referenceDocId: string;

  @IsString()
  referenceName: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  outstandingAmount: number;

  @IsNumber()
  allocatedAmount: number;
}
