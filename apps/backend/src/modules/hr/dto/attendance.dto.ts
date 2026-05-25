import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AttendanceStatusEnum {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
  HOLIDAY = 'HOLIDAY',
}

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: AttendanceStatusEnum, default: 'PRESENT' })
  @IsOptional()
  @IsEnum(AttendanceStatusEnum)
  status?: AttendanceStatusEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  checkOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  overtimeHours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [MarkAttendanceDto] })
  records: MarkAttendanceDto[];
}

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Annual Leave' })
  @IsString()
  name: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  daysAllowed: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isPaid?: boolean;
}

export class CreateLeaveRequestDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty()
  @IsUUID()
  leaveTypeId: string;

  @ApiProperty({ example: '2024-07-15' })
  @IsDateString()
  fromDate: string;

  @ApiProperty({ example: '2024-07-17' })
  @IsDateString()
  toDate: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  days: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateAdvanceDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 10000 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GenerateSalarySlipDto {
  @ApiProperty()
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 7 })
  @IsNumber()
  month: number;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;
}

export class GeneratePayrollDto {
  @ApiProperty({ example: 7 })
  @IsNumber()
  month: number;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;
}
