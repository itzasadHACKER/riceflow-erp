import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProcessTypeEnum {
  SHELLING = 'SHELLING',
  POLISHING = 'POLISHING',
  SELLA = 'SELLA',
  STEAM = 'STEAM',
  SORTING = 'SORTING',
  GRADING = 'GRADING',
  CLEANING = 'CLEANING',
}

export class ProductionOutputDto {
  @ApiProperty()
  @IsUUID()
  outputVarietyId: string;

  @ApiProperty({ example: 6500 })
  @IsNumber()
  @Min(0)
  outputWeight: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  recoveryPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProductionCostDto {
  @ApiProperty({ example: 'LABOR' })
  @IsString()
  costType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateProductionBatchDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  inputVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inputLotNumber?: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  inputWeight: number;

  @ApiProperty({ enum: ProcessTypeEnum })
  @IsEnum(ProcessTypeEnum)
  processType: ProcessTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StartBatchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteBatchDto {
  @ApiProperty({ type: [ProductionOutputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionOutputDto)
  outputs: ProductionOutputDto[];

  @ApiPropertyOptional({ type: [ProductionCostDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionCostDto)
  costs?: ProductionCostDto[];
}

export class CreateMillingRecordDto {
  @ApiProperty()
  @IsUUID()
  batchId: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  paddyInputWeight: number;

  @ApiProperty({ example: 6500 })
  @IsNumber()
  @Min(0)
  riceOutputWeight: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  brokenOutputWeight?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  huskWeight?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  branWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
