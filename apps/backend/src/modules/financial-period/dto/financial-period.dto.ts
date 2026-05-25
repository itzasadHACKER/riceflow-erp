import { IsString, IsOptional, IsUUID, IsNumber, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFinancialPeriodDto {
  @ApiProperty() @IsUUID() fiscalYearId: string;
  @ApiProperty() @IsInt() periodNumber: number;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() startDate: string;
  @ApiProperty() @IsString() endDate: string;
}

export class CreateWithholdingTaxDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsNumber() rate: number;
  @ApiPropertyOptional() @IsOptional() @IsString() applicableTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() thresholdAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() accountCode?: string;
}

export class CreateInternalReconciliationDto {
  @ApiProperty() @IsUUID() partnerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerType?: string;
  @ApiProperty() @IsNumber() totalAmount: number;
  @ApiPropertyOptional() @IsOptional() entries?: any[];
}

export class CreateAdvancePaymentDto {
  @ApiProperty() @IsUUID() partnerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerType?: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
