import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty() @IsString() batchNumber: string;
  @ApiProperty() @IsString() itemCode: string;
  @ApiProperty() @IsNumber() quantity: number;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturingDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierBatch?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateSerialNumberDto {
  @ApiProperty() @IsString() serialNumber: string;
  @ApiProperty() @IsString() itemCode: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warrantyStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warrantyEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
