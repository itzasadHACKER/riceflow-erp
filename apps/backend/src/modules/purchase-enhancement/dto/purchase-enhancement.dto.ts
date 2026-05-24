import { IsString, IsOptional, IsUUID, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseRequisitionDto {
  @ApiProperty() @IsString() requiredDate: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() justification?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() items?: any[];
}

export class CreatePurchaseQuotationDto {
  @ApiProperty() @IsUUID() supplierId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() validUntil?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() items?: any[];
}
