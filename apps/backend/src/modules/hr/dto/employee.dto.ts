import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EmploymentTypeEnum {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  DAILY_WAGE = 'DAILY_WAGE',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum MaritalStatusEnum {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  WIDOWED = 'WIDOWED',
  DIVORCED = 'DIVORCED',
}

export enum EmployeeStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  LEFT = 'LEFT',
}

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP-001' })
  @IsString()
  employeeCode: string;

  @ApiPropertyOptional({ description: 'Naming series for auto-numbering' })
  @IsOptional()
  @IsString()
  namingSeries?: string;

  @ApiProperty({ example: 'Muhammad' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Ali' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Employee display name' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: MaritalStatusEnum })
  @IsOptional()
  @IsEnum(MaritalStatusEnum)
  maritalStatus?: MaritalStatusEnum;

  @ApiPropertyOptional({ description: 'Father name / guardian' })
  @IsOptional()
  @IsString()
  fatherName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Personal mobile number' })
  @IsOptional()
  @IsString()
  cellPhone?: string;

  @ApiPropertyOptional({ description: 'Personal email' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({ description: 'Company email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional({ description: 'Passport number' })
  @IsOptional()
  @IsString()
  passportNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ description: 'Reports to employee ID' })
  @IsOptional()
  @IsUUID()
  reportsTo?: string;

  @ApiPropertyOptional({ enum: EmploymentTypeEnum })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  joinDate: string;

  @ApiPropertyOptional({ description: 'Date of confirmation' })
  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @ApiPropertyOptional({ description: 'Contract end date' })
  @IsOptional()
  @IsDateString()
  contractEndDate?: string;

  @ApiPropertyOptional({ description: 'Notice period in days' })
  @IsOptional()
  @IsNumber()
  noticeDays?: number;

  @ApiPropertyOptional({ description: 'Attendance device ID (biometric)' })
  @IsOptional()
  @IsString()
  attendanceDeviceId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiPropertyOptional({ description: 'Salary mode: Monthly, Daily, Hourly' })
  @IsOptional()
  @IsString()
  salaryMode?: string;

  @ApiPropertyOptional({ description: 'Payroll cost center' })
  @IsOptional()
  @IsUUID()
  payrollCostCenterId?: string;

  @ApiPropertyOptional({ description: 'Default shift type' })
  @IsOptional()
  @IsString()
  defaultShift?: string;

  @ApiPropertyOptional({ description: 'Holiday list' })
  @IsOptional()
  @IsString()
  holidayList?: string;

  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank IBAN' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'EOBI number' })
  @IsOptional()
  @IsString()
  eobiNumber?: string;

  @ApiPropertyOptional({ description: 'Social security number' })
  @IsOptional()
  @IsString()
  socialSecurityNo?: string;

  @ApiPropertyOptional({ description: 'Health insurance number' })
  @IsOptional()
  @IsString()
  healthInsuranceNo?: string;

  @ApiPropertyOptional({ description: 'Health insurance provider' })
  @IsOptional()
  @IsString()
  healthInsuranceProvider?: string;

  @ApiPropertyOptional({ description: 'Blood group' })
  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @ApiPropertyOptional({ description: 'Current address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Permanent address' })
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Relation with emergency contact' })
  @IsOptional()
  @IsString()
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: 'Education qualifications (JSON)' })
  @IsOptional()
  educationDetails?: any;

  @ApiPropertyOptional({ description: 'Previous work experience (JSON)' })
  @IsOptional()
  workExperience?: any;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cellPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reportsTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ enum: EmployeeStatusEnum })
  @IsOptional()
  @IsEnum(EmployeeStatusEnum)
  status?: EmployeeStatusEnum;

  @ApiPropertyOptional({ description: 'Relieving date (final working day)' })
  @IsOptional()
  @IsDateString()
  relievingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  exitDate?: string;

  @ApiPropertyOptional({ description: 'Reason for leaving' })
  @IsOptional()
  @IsString()
  reasonForLeaving?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  payrollCostCenterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salaryMode?: string;
}
