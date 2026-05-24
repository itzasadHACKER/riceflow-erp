import { IsString, IsOptional, IsArray, IsEnum, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmailServerType {
  SMTP = 'SMTP',
  IMAP = 'IMAP',
}

export class ConfigureEmailServerDto {
  @ApiProperty({ enum: EmailServerType })
  @IsEnum(EmailServerType)
  serverType!: EmailServerType;

  @ApiProperty()
  @IsString()
  host!: string;

  @ApiProperty()
  @IsInt()
  port!: number;

  @ApiProperty()
  @IsString()
  username!: string;

  @ApiProperty()
  @IsString()
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useSsl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useTls?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromEmail?: string;
}

export class SendEmailDto {
  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  to!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cc?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bcc?: string[];

  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHtml?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  replyTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedEntityId?: string;
}

export class EmailFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
