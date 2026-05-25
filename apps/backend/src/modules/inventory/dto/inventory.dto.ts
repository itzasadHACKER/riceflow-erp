import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MovementTypeEnum {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Main Godown' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'GDN-001' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({ default: 'TON' })
  @IsOptional()
  @IsString()
  capacityUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

export class CreateInventoryItemDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  bagCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bagWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityGrade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  valuationRate?: number;
}

export class CreateStockMovementDto {
  @ApiProperty({ enum: MovementTypeEnum })
  @IsEnum(MovementTypeEnum)
  movementType: MovementTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ default: 'KG' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  movementDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateStockAdjustmentDto {
  @ApiProperty()
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  adjustmentDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiProperty({ example: 50 })
  @IsNumber()
  quantityChange: number;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(0)
  previousQuantity: number;

  @ApiProperty({ example: 1050 })
  @IsNumber()
  @Min(0)
  newQuantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
