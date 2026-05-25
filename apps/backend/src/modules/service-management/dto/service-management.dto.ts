import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceCallStatusDto { OPEN = 'OPEN', IN_PROGRESS = 'IN_PROGRESS', ESCALATED = 'ESCALATED', ON_HOLD = 'ON_HOLD', RESOLVED = 'RESOLVED', CLOSED = 'CLOSED' }
export enum ServiceCallPriorityDto { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', CRITICAL = 'CRITICAL' }

export class CreateServiceCallDto {
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsUUID() customerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactPerson?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() origin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() equipmentCardId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
}

export class UpdateServiceCallDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() resolutionNote?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
}

export class CreateServiceContractDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiProperty() @IsString() contractType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() startDate: string;
  @ApiProperty() @IsString() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() responseTimeSla?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() resolutionTimeSla?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() value?: number;
}

export class CreateEquipmentCardDto {
  @ApiProperty() @IsUUID() customerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warrantyStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warrantyEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
}

export class CreateServiceSolutionDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsString() resolution: string;
  @ApiPropertyOptional() @IsOptional() @IsString() symptom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cause?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemCode?: string;
}
