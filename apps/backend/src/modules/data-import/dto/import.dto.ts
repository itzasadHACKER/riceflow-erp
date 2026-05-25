import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ImportTypeEnum {
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  EMPLOYEES = 'EMPLOYEES',
  CHART_OF_ACCOUNTS = 'CHART_OF_ACCOUNTS',
  RICE_VARIETIES = 'RICE_VARIETIES',
  WAREHOUSES = 'WAREHOUSES',
  INVENTORY_ITEMS = 'INVENTORY_ITEMS',
}

export class DataImportDto {
  @ApiProperty({ enum: ImportTypeEnum })
  @IsEnum(ImportTypeEnum)
  importType!: ImportTypeEnum;

  @ApiProperty({
    type: [Object],
    description: 'Array of key-value row objects',
  })
  @IsArray()
  rows!: Record<string, string>[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fileName?: string;
}

export class ImportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  importType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
