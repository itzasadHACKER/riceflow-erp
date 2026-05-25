import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePriceListDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() validTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() basePriceListId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() factor?: number;
}

export class AddPriceListItemDto {
  @ApiProperty() @IsString() itemCode: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemName?: string;
  @ApiProperty() @IsNumber() price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() minimumQty?: number;
}

export class CreateDiscountGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tiers?: any[];
}

export class CreateSpecialPriceDto {
  @ApiProperty() @IsUUID() partnerId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partnerType?: string;
  @ApiProperty() @IsString() itemCode: string;
  @ApiProperty() @IsNumber() price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() discountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() validTo?: string;
}
