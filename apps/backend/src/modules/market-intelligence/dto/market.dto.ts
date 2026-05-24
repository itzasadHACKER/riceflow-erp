import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarketRateDto {
  @ApiProperty() @IsString() commodityType!: string;
  @ApiProperty() @IsString() commodityName!: string;
  @ApiProperty() @IsString() market!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() region?: string;
  @ApiProperty() @IsString() minRate!: string;
  @ApiProperty() @IsString() maxRate!: string;
  @ApiProperty() @IsString() avgRate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiProperty() @IsString() date!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
