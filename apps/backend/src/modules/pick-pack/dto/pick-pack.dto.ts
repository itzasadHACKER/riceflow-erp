import { IsString, IsOptional, IsUUID, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePickListDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() salesOrderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() warehouseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() items?: any[];
}

export class CreatePackingListDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() pickListId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() salesOrderId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trackingNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalWeight?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() totalPackages?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() packages?: any[];
}
