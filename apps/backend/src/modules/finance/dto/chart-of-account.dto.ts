import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum BalanceTypeEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export class CreateChartOfAccountDto {
  @ApiProperty({ example: '1000' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Cash in Hand' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountTypeEnum })
  @IsEnum(AccountTypeEnum)
  accountType: AccountTypeEnum;

  @ApiProperty({ enum: BalanceTypeEnum })
  @IsEnum(BalanceTypeEnum)
  balanceType: BalanceTypeEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateChartOfAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
