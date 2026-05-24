import { IsString, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum BudgetStatusEnum {
  DRAFT_BUDGET = 'DRAFT_BUDGET',
  ACTIVE_BUDGET = 'ACTIVE_BUDGET',
  CLOSED_BUDGET = 'CLOSED_BUDGET',
  REVISED_BUDGET = 'REVISED_BUDGET',
}

export class BudgetLineDto {
  @ApiProperty()
  @IsString()
  accountId!: string;

  @ApiProperty()
  @IsString()
  annualAmount!: string;

  @ApiPropertyOptional({ description: 'Monthly breakdown JSON' })
  @IsOptional()
  monthlyAmounts?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBudgetDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  fiscalYearId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costCenter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [BudgetLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetLineDto)
  lines!: BudgetLineDto[];
}

export class UpdateBudgetStatusDto {
  @ApiProperty({ enum: BudgetStatusEnum })
  @IsEnum(BudgetStatusEnum)
  status!: BudgetStatusEnum;
}
