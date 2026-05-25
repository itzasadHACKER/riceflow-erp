import { IsString, IsOptional, IsEnum, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BomItemDto {
  @ApiProperty()
  @IsString()
  riceVarietyId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateBomDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  outputVarietyId: string;

  @ApiProperty()
  @IsNumber()
  outputQuantity: number;

  @ApiProperty({ enum: ['SHELLING', 'POLISHING', 'SELLA', 'STEAM', 'SORTING', 'GRADING', 'CLEANING'] })
  @IsString()
  processType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [BomItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomItemDto)
  items: BomItemDto[];
}
