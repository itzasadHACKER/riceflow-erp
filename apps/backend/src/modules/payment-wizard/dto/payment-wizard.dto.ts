import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentRunDto {
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() payments?: any[];
  @ApiPropertyOptional() @IsOptional() filters?: any;
}

export class CreateDunningLevelDto {
  @ApiProperty() @IsNumber() level: number;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsNumber() daysOverdue: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() chargePercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() chargeAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() letterTemplate?: string;
}

export class RunDunningDto {
  @ApiPropertyOptional() @IsOptional() @IsString() asOfDate?: string;
}
