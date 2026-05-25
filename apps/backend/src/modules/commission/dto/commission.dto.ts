import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommissionRuleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() entityType!: string;
  @ApiProperty() @IsString() commissionType!: string;
  @ApiProperty() @IsString() rate!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPercentage?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() minAmount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() maxAmount?: string;
}

export class CreateCommissionEntryDto {
  @ApiProperty() @IsString() partyType!: string;
  @ApiProperty() @IsString() partyId!: string;
  @ApiProperty() @IsString() partyName!: string;
  @ApiProperty() @IsString() referenceType!: string;
  @ApiProperty() @IsString() referenceId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceNumber?: string;
  @ApiProperty() @IsString() transactionAmount!: string;
  @ApiProperty() @IsString() commissionRate!: string;
  @ApiProperty() @IsString() commissionAmount!: string;
  @ApiProperty() @IsString() date!: string;
}

export class CreateSettlementDto {
  @ApiProperty() @IsString() partyType!: string;
  @ApiProperty() @IsString() partyId!: string;
  @ApiProperty() @IsString() partyName!: string;
  @ApiProperty() @IsString() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentRef?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
