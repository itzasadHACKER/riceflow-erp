import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SupplierTypeEnum {
  FARMER = 'FARMER',
  DEALER = 'DEALER',
  COMMISSION_AGENT = 'COMMISSION_AGENT',
  ARTHI = 'ARTHI',
}

export enum RiceTypeEnum {
  PADDY = 'PADDY',
  RICE = 'RICE',
}

export enum RiceCategoryEnum {
  BASMATI = 'BASMATI',
  NON_BASMATI = 'NON_BASMATI',
  SELLA = 'SELLA',
  STEAM = 'STEAM',
  PARBOILED = 'PARBOILED',
  BROKEN = 'BROKEN',
  OTHER = 'OTHER',
}

export enum QualityGradeEnum {
  A_PLUS = 'A_PLUS',
  A = 'A',
  B = 'B',
  C = 'C',
  REJECT = 'REJECT',
}

export class CreateSupplierDto {
  @ApiProperty({ example: 'Haji Muhammad Arif' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ntn?: string;

  @ApiPropertyOptional({ enum: SupplierTypeEnum })
  @IsOptional()
  @IsEnum(SupplierTypeEnum)
  supplierType?: SupplierTypeEnum;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}

export class UpdateSupplierDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRiceVarietyDto {
  @ApiProperty({ example: 'Super Basmati' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SB' })
  @IsString()
  code: string;

  @ApiProperty({ enum: RiceTypeEnum })
  @IsEnum(RiceTypeEnum)
  riceType: RiceTypeEnum;

  @ApiProperty({ enum: RiceCategoryEnum })
  @IsEnum(RiceCategoryEnum)
  category: RiceCategoryEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  defaultMoisture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreatePaddyPurchaseDto {
  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty({ example: '2024-10-15' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  supplierId: string;

  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brokerId?: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  @Min(0)
  grossWeight: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  tareWeight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  moisturePercentage?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deductionPercentage?: number;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  ratePerUnit: number;

  @ApiPropertyOptional({ enum: QualityGradeEnum })
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  qualityGrade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  gatePassNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseRateDto {
  @ApiProperty()
  @IsUUID()
  riceVarietyId: string;

  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiProperty({ example: '2024-10-01' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minMoisture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxMoisture?: number;
}

export class CreateQualityTestDto {
  @ApiProperty()
  @IsUUID()
  paddyPurchaseId: string;

  @ApiProperty({ example: '2024-10-15' })
  @IsDateString()
  testDate: string;

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

  @ApiPropertyOptional({ enum: QualityGradeEnum })
  @IsOptional()
  @IsEnum(QualityGradeEnum)
  grade?: QualityGradeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
