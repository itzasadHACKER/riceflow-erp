import { IsString, IsOptional, IsArray, IsInt, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowStepDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsInt()
  stepNumber!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approverRole?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  approverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  condition?: string;
}

export class CreateWorkflowDefinitionDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  entityType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  steps!: WorkflowStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  autoEscalateHours?: number;
}

export enum WorkflowActionEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ESCALATE = 'ESCALATE',
  DELEGATE = 'DELEGATE',
}

export class WorkflowActionDto {
  @ApiProperty({ enum: WorkflowActionEnum })
  @IsEnum(WorkflowActionEnum)
  action!: WorkflowActionEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  delegateTo?: string;
}

export class InitiateWorkflowDto {
  @ApiProperty()
  @IsString()
  workflowDefinitionId!: string;

  @ApiProperty()
  @IsString()
  entityType!: string;

  @ApiProperty()
  @IsString()
  entityId!: string;
}

export class WorkflowFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
