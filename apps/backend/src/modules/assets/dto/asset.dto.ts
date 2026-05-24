import {
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
  IsNumber,
  IsEnum,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DepreciationMethodEnum {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DECLINING_BALANCE = 'DECLINING_BALANCE',
  DOUBLE_DECLINING = 'DOUBLE_DECLINING',
  UNITS_OF_PRODUCTION = 'UNITS_OF_PRODUCTION',
}

export enum AssetStatusEnum {
  ACTIVE = 'ACTIVE',
  DISPOSED = 'DISPOSED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
}

export class CreateFixedAssetDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty()
  @IsDateString()
  purchaseDate!: string;

  @ApiProperty()
  @IsNumber()
  purchasePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salvageValue?: number;

  @ApiProperty()
  @IsInt()
  usefulLifeYears!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(DepreciationMethodEnum)
  depreciationMethod?: DepreciationMethodEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assetAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deprExpenseAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accumDeprAccountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;
}

export class UpdateFixedAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salvageValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AssetStatusEnum)
  status?: AssetStatusEnum;
}

export class DisposeAssetDto {
  @ApiProperty()
  @IsDateString()
  disposalDate!: string;

  @ApiProperty()
  @IsNumber()
  disposalAmount!: number;
}

export class RunDepreciationDto {
  @ApiProperty({ description: 'Period identifier e.g. 2024-01' })
  @IsString()
  period!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty()
  @IsUUID()
  fiscalYearId!: string;
}

export class AssetFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AssetStatusEnum)
  status?: AssetStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
