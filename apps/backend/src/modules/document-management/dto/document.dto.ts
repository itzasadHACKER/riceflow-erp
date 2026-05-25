import { IsString, IsOptional, IsInt, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() documentType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fileName?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() mimeType?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() expiryDate?: string;
}

export class CreateDocumentVersionDto {
  @ApiProperty() @IsString() fileUrl!: string;
  @ApiProperty() @IsString() fileName!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() fileSize?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() changeNote?: string;
}

export class CreateContractDto {
  @ApiProperty() @IsString() contractNumber!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() contractType!: string;
  @ApiProperty() @IsString() partyType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partyId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partyName?: string;
  @ApiProperty() @IsString() startDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() renewalDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autoRenew?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() signedBy?: string;
}
