import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChequeStatusEnum {
  ISSUED = 'ISSUED',
  CLEARED = 'CLEARED',
  BOUNCED = 'BOUNCED',
  CANCELLED = 'CANCELLED',
  DEPOSITED = 'DEPOSITED',
  RETURNED = 'RETURNED',
}

export enum ReconciliationStatusEnum {
  PENDING_RECONCILIATION = 'PENDING_RECONCILIATION',
  MATCHED = 'MATCHED',
  UNMATCHED = 'UNMATCHED',
  PARTIALLY_MATCHED = 'PARTIALLY_MATCHED',
}

export class CreateBankReconciliationDto {
  @ApiProperty()
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsDateString()
  statementDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  debit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  credit?: number;

  @ApiProperty()
  @IsNumber()
  balance!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

export class MatchReconciliationDto {
  @ApiProperty()
  @IsUUID()
  matchedEntryId!: string;
}

export class CreateChequeDto {
  @ApiProperty()
  @IsUUID()
  bankAccountId!: string;

  @ApiProperty()
  @IsString()
  chequeNumber!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issuedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class UpdateChequeStatusDto {
  @ApiProperty()
  @IsEnum(ChequeStatusEnum)
  status!: ChequeStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clearanceDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bounceReason?: string;
}

export class BankFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;

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
