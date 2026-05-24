import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SalespersonStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export class CreateSalespersonDto {
  @ApiProperty()
  @IsString()
  name: string;

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
  territory?: string;

  @ApiProperty()
  @IsDateString()
  joiningDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetMonthly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetYearly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;
}

export class AssignPartyDto {
  @ApiProperty()
  @IsString()
  customerId: string;
}

export class RecordSaleDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riceVarietyId?: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
