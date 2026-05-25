import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChannelType {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  INTERNAL = 'INTERNAL',
}

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channel!: ChannelType;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  participantIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedEntityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedEntityId?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHtml?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class CreateContactGroupDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  contactIds!: string[];
}
