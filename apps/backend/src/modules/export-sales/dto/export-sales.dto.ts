import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LCStatusEnum {
  DRAFT_LC = 'DRAFT_LC',
  OPENED = 'OPENED',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  NEGOTIATED = 'NEGOTIATED',
  SETTLED_LC = 'SETTLED_LC',
  EXPIRED_LC = 'EXPIRED_LC',
  CANCELLED_LC = 'CANCELLED_LC',
}

export class CreateExportContractDto {
  @ApiProperty() @IsString() contractNumber!: string;
  @ApiProperty() @IsString() customerId!: string;
  @ApiProperty() @IsString() buyerName!: string;
  @ApiProperty() @IsString() buyerCountry!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() riceVarietyId?: string;
  @ApiProperty() @IsString() quantity!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiProperty() @IsString() pricePerUnit!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() incoterm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() portOfLoading?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() portOfDischarge?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shipmentDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateLCDto {
  @ApiProperty() @IsString() exportContractId!: string;
  @ApiProperty() @IsString() lcNumber!: string;
  @ApiProperty() @IsString() issuingBank!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() advisingBank?: string;
  @ApiProperty() @IsString() amount!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiProperty() @IsString() issueDate!: string;
  @ApiProperty() @IsString() expiryDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shipmentDeadline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
}

export class UpdateLCStatusDto {
  @ApiProperty({ enum: LCStatusEnum })
  @IsEnum(LCStatusEnum)
  status!: LCStatusEnum;
}

export class CreateShippingDocDto {
  @ApiProperty() @IsString() exportContractId!: string;
  @ApiProperty() @IsString() documentType!: string;
  @ApiProperty() @IsString() documentNumber!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() containerNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vesselName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() billOfLading?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() arrivalDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() weight?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
