import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NoteStatusEnum {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export class CreateCreditNoteDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesInvoiceId?: string;

  @ApiProperty()
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiProperty()
  @IsNumber()
  netAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class UpdateCreditNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateDebitNoteDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @ApiProperty()
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiProperty()
  @IsNumber()
  netAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class UpdateDebitNoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  netAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreatePurchaseReturnDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsUUID()
  supplierId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  rate!: number;

  @ApiProperty()
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateSalesReturnDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  rate!: number;

  @ApiProperty()
  @IsNumber()
  totalAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class NoteFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(NoteStatusEnum)
  status?: NoteStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
