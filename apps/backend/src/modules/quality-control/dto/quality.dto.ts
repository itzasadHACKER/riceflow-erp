import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InspectionStatusEnum {
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

export enum QualityGradeEnum {
  A_PLUS = 'A_PLUS',
  A = 'A',
  B = 'B',
  C = 'C',
  REJECT = 'REJECT',
}

export class CreateQualityInspectionDto {
  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'e.g. PADDY_PURCHASE, PRODUCTION_BATCH, GOODS_RECEIPT',
  })
  @IsString()
  referenceType!: string;

  @ApiProperty()
  @IsUUID()
  referenceId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riceVarietyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sampleSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  brokenPercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  foreignMatter?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  chalkyGrains?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  damagedGrains?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discolored?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grainLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  grainWidth?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aroma?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cookingQuality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  grade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateInspectionStatusDto {
  @ApiProperty()
  @IsEnum(InspectionStatusEnum)
  status!: InspectionStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  grade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  certificateNumber?: string;
}

export class QualityFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(InspectionStatusEnum)
  status?: InspectionStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

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
