import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCurrencyDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() symbol!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() decimalPlaces?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBaseCurrency?: boolean;
}

export class CreateExchangeRateDto {
  @ApiProperty() @IsString() currencyId!: string;
  @ApiProperty() @IsString() rate!: string;
  @ApiProperty() @IsString() effectiveDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
}
