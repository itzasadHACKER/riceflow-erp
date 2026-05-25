import { IsString, IsOptional, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MachineStatusEnum {
  OPERATIONAL = 'OPERATIONAL',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  BREAKDOWN = 'BREAKDOWN',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

export enum MaintenanceTypeEnum {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  BREAKDOWN_REPAIR = 'BREAKDOWN_REPAIR',
  OVERHAUL = 'OVERHAUL',
}

export class CreateMachineDto {
  @ApiProperty() @IsString() machineCode!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() category!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() installDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() capacity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() capacityUnit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() powerRating?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() purchasePrice?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() warrantyExpiry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateMaintenanceLogDto {
  @ApiProperty() @IsString() machineId!: string;
  @ApiProperty({ enum: MaintenanceTypeEnum }) @IsEnum(MaintenanceTypeEnum) maintenanceType!: MaintenanceTypeEnum;
  @ApiPropertyOptional() @IsOptional() @IsString() scheduledDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() completedDate?: string;
  @ApiProperty() @IsString() description!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() findings?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partsCost?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() laborCost?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() performedBy?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nextScheduled?: string;
}

export class CreateSpareDto {
  @ApiProperty() @IsString() machineId!: string;
  @ApiProperty() @IsString() partName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() partNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() quantity?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() minStock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unitCost?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplier?: string;
}

export class CreateDowntimeDto {
  @ApiProperty() @IsString() machineId!: string;
  @ApiProperty() @IsString() startTime!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() endTime?: string;
  @ApiProperty() @IsString() reason!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productionLoss?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() resolved?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() resolution?: string;
}
