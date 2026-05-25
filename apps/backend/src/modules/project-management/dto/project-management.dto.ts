import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() budgetAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() costCenterId?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() completionPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() actualCost?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateTaskDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() parentTaskId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedToId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() estimatedHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() dependsOnTaskId?: string;
}

export class CreateTimesheetDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() taskId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
  @ApiProperty() @IsString() date: string;
  @ApiProperty() @IsNumber() hours: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() billable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() hourlyRate?: number;
}

export class CreateMilestoneDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() dueDate: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() billingAmount?: number;
}

export class CreateProjectExpenseDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiProperty() @IsString() date: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
}
