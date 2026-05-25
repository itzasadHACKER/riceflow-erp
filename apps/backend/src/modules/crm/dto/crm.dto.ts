import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeadSourceEnum {
  REFERRAL = 'REFERRAL',
  WALK_IN = 'WALK_IN',
  ONLINE = 'ONLINE',
  BROKER = 'BROKER',
  COLD_CALL = 'COLD_CALL',
  EXHIBITION = 'EXHIBITION',
}

export enum LeadStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST',
}

export enum CommunicationChannelEnum {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  VISIT = 'VISIT',
  SMS = 'SMS',
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Ahmad Rice Mills' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: LeadSourceEnum })
  @IsOptional()
  @IsEnum(LeadSourceEnum)
  source?: LeadSourceEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: LeadStatusEnum })
  @IsOptional()
  @IsEnum(LeadStatusEnum)
  status?: LeadStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBrokerDto {
  @ApiProperty({ example: 'Muhammad Irfan' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateBrokerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;
}

export class CreateCommunicationLogDto {
  @ApiProperty({ example: 'LEAD' })
  @IsString()
  contactType: string;

  @ApiProperty()
  @IsUUID()
  contactId: string;

  @ApiProperty({ enum: CommunicationChannelEnum })
  @IsEnum(CommunicationChannelEnum)
  channel: CommunicationChannelEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;
}

export class CreateFollowUpDto {
  @ApiProperty()
  @IsUUID()
  communicationLogId: string;

  @ApiProperty({ example: '2024-10-25' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
