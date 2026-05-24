import { IsString, IsOptional, IsUUID, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductionOrderDto {
  @ApiProperty() @IsString() itemCode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemName?: string;
  @ApiProperty() @IsNumber() plannedQty: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() bomId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() components?: any[];
  @ApiPropertyOptional() @IsOptional() @IsArray() operations?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}

export class CreateGoodsTransactionDto {
  @ApiProperty() @IsString() type: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() items?: any[];
}

export class CreateReturnRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiProperty() @IsUUID() partnerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() originalDocRef?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() items?: any[];
}
