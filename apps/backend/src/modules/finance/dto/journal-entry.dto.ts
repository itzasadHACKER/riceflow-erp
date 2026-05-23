import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JournalEntryTypeEnum {
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM',
  ADJUSTMENT = 'ADJUSTMENT',
  OPENING = 'OPENING',
}

export class JournalEntryLineDto {
  @ApiProperty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCenter?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiPropertyOptional({ enum: JournalEntryTypeEnum, default: 'MANUAL' })
  @IsOptional()
  @IsEnum(JournalEntryTypeEnum)
  entryType?: JournalEntryTypeEnum;

  @ApiProperty()
  @IsUUID()
  fiscalYearId: string;

  @ApiProperty({ type: [JournalEntryLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalEntryLineDto)
  lines: JournalEntryLineDto[];
}

export class PostJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}

export class JournalEntryFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fiscalYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ enum: JournalEntryTypeEnum })
  @IsOptional()
  @IsEnum(JournalEntryTypeEnum)
  entryType?: JournalEntryTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  isPosted?: boolean;
}
