import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCostCenterDto {
  @ApiProperty() @IsString() code: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() budgetAmount?: number;
}

export class CreateCostAllocationDto {
  @ApiProperty() @IsUUID() costCenterId: string;
  @ApiProperty() @IsUUID() targetCenterId: string;
  @ApiProperty() @IsNumber() percentage: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() effectiveDate: string;
}
