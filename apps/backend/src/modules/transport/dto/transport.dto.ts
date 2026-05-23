import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VehicleTypeEnum {
  TRUCK = 'TRUCK',
  TRAILER = 'TRAILER',
  PICKUP = 'PICKUP',
  TRACTOR_TROLLEY = 'TRACTOR_TROLLEY',
  CONTAINER = 'CONTAINER',
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'LEA-1234' })
  @IsString()
  vehicleNumber: string;

  @ApiPropertyOptional({ enum: VehicleTypeEnum })
  @IsOptional()
  @IsEnum(VehicleTypeEnum)
  vehicleType?: VehicleTypeEnum;

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
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOwn?: boolean;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateDriverDto {
  @ApiProperty({ example: 'Muhammad Riaz' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;
}

export class UpdateDriverDto {
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
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFreightEntryDto {
  @ApiProperty({ example: '2024-10-20' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ example: 'Gujranwala' })
  @IsString()
  fromLocation: string;

  @ApiProperty({ example: 'Lahore' })
  @IsString()
  toLocation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  freightAmount: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  loadingCharges?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  unloadingCharges?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}
