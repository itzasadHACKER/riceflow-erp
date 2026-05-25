import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIntegrationConfigDto {
  @ApiProperty() @IsString() provider!: string;
  @ApiProperty() @IsString() integrationType!: string;
  @ApiPropertyOptional() @IsOptional() config?: Record<string, string>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AiChatDto {
  @ApiProperty() @IsString() message!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() conversationId?: string;
  @ApiPropertyOptional() @IsOptional() context?: Record<string, string>;
}

export class CreateScheduledJobDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() jobType!: string;
  @ApiProperty({ description: 'Cron expression' }) @IsString() schedule!: string;
  @ApiPropertyOptional() @IsOptional() config?: Record<string, string>;
}

export class SendNotificationDto {
  @ApiProperty() @IsString() channel!: string;
  @ApiProperty() @IsString() recipient!: string;
  @ApiProperty() @IsString() subject!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() metadata?: Record<string, string>;
}
