import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertSettingDto {
  @ApiProperty({ example: 'company_name' })
  @IsString()
  key: string;

  @ApiProperty({ example: { value: 'RiceFlow ERP' } })
  value: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateNotificationDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'New Sales Order' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Sales order SO-000001 has been created' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ default: 'INFO' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

export class CreateAuditLogDto {
  @ApiProperty({ example: 'SalesOrder' })
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsUUID()
  entityId: string;

  @ApiProperty({ example: 'CREATE' })
  @IsString()
  action: string;

  @ApiPropertyOptional()
  @IsOptional()
  oldValues?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  newValues?: Record<string, unknown>;
}
