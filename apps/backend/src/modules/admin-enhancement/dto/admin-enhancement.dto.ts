import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDefinedTableDto {
  @ApiProperty() @IsString() tableName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() columns?: any[];
}

export class AddTableDataDto {
  @ApiProperty() data: any;
}

export class CreateAuthorizationGroupDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() module: string;
  @ApiPropertyOptional() @IsOptional() permissions?: any;
  @ApiPropertyOptional() @IsOptional() dataOwnership?: any;
}
