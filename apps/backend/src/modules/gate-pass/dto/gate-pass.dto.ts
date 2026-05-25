import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GatePassType {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
  VISITOR = 'VISITOR',
}

export enum GatePassStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  CHECKED_OUT = 'CHECKED_OUT',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OutgoingCategory {
  RICE_SALE = 'RICE_SALE',
  MACHINERY = 'MACHINERY',
  SAMPLES = 'SAMPLES',
  OFFICE_EQUIPMENT = 'OFFICE_EQUIPMENT',
  STATIONERY = 'STATIONERY',
  ELECTRICAL = 'ELECTRICAL',
  WASTE_DISPOSAL = 'WASTE_DISPOSAL',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export enum IncomingCategory {
  PADDY = 'PADDY',
  GROCERY = 'GROCERY',
  MACHINERY = 'MACHINERY',
  STATIONERY = 'STATIONERY',
  ELECTRICAL_EQUIPMENT = 'ELECTRICAL_EQUIPMENT',
  OFFICE_EQUIPMENT = 'OFFICE_EQUIPMENT',
  RAW_MATERIAL = 'RAW_MATERIAL',
  SPARE_PARTS = 'SPARE_PARTS',
  FUEL = 'FUEL',
  MISCELLANEOUS = 'MISCELLANEOUS',
}

export class GatePassItemDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateGatePassDto {
  @ApiProperty({ enum: GatePassType })
  @IsEnum(GatePassType)
  type: GatePassType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;

  // Outgoing
  @ApiPropertyOptional({ enum: OutgoingCategory })
  @IsOptional()
  @IsEnum(OutgoingCategory)
  outgoingCategory?: OutgoingCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salesOrderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deliveryChallanId?: string;

  // Incoming
  @ApiPropertyOptional({ enum: IncomingCategory })
  @IsOptional()
  @IsEnum(IncomingCategory)
  incomingCategory?: IncomingCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderId?: string;

  // Visitor
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorIdType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  visitorIdNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  personToMeet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedDuration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeNumber?: string;

  @ApiPropertyOptional({ type: [GatePassItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GatePassItemDto)
  items?: GatePassItemDto[];
}

export class UpdateGatePassStatusDto {
  @ApiProperty({ enum: GatePassStatus })
  @IsEnum(GatePassStatus)
  status: GatePassStatus;
}
