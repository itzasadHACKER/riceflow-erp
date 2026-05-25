import { IsString, IsOptional, IsNumber, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunMrpDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() planningHorizon?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() itemCodes?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() warehouseId?: string;
}

export class CreateForecastDto {
  @ApiProperty() @IsString() itemCode: string;
  @ApiProperty() @IsString() periodStart: string;
  @ApiProperty() @IsString() periodEnd: string;
  @ApiProperty() @IsNumber() forecastQty: number;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ConvertRecommendationDto {
  @ApiProperty() @IsString() recommendationId: string;
  @ApiProperty() @IsString() targetDocType: string;
}
