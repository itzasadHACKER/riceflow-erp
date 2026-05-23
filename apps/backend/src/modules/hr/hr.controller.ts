import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  MarkAttendanceDto,
  CreateLeaveTypeDto,
  CreateLeaveRequestDto,
  CreateAdvanceDto,
  GenerateSalarySlipDto,
  GeneratePayrollDto,
} from './dto/attendance.dto';

@ApiTags('hr')
@Controller('hr')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ===== EMPLOYEES =====

  @Post('employees')
  @ApiOperation({ summary: 'Create employee' })
  async createEmployee(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateEmployeeDto,
  ) {
    const emp = await this.hrService.createEmployee(user.organizationId, dto);
    return createResponse(emp);
  }

  @Get('employees')
  @ApiOperation({ summary: 'List employees' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listEmployees(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.hrService.listEmployees(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async getEmployee(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const emp = await this.hrService.getEmployee(user.organizationId, id);
    return createResponse(emp);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  async updateEmployee(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const emp = await this.hrService.updateEmployee(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(emp);
  }

  // ===== ATTENDANCE =====

  @Post('attendance')
  @ApiOperation({ summary: 'Mark attendance' })
  async markAttendance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MarkAttendanceDto,
  ) {
    const record = await this.hrService.markAttendance(
      user.organizationId,
      dto,
    );
    return createResponse(record);
  }

  @Get('attendance/:employeeId')
  @ApiOperation({ summary: 'Get employee attendance for a month' })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  async getAttendance(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const records = await this.hrService.getAttendance(
      user.organizationId,
      employeeId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return createResponse(records);
  }

  @Get('attendance/:employeeId/summary')
  @ApiOperation({ summary: 'Get attendance summary for a month' })
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  async getAttendanceSummary(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const summary = await this.hrService.getAttendanceSummary(
      user.organizationId,
      employeeId,
      parseInt(month, 10),
      parseInt(year, 10),
    );
    return createResponse(summary);
  }

  // ===== LEAVE MANAGEMENT =====

  @Post('leave-types')
  @ApiOperation({ summary: 'Create leave type' })
  async createLeaveType(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaveTypeDto,
  ) {
    const lt = await this.hrService.createLeaveType(user.organizationId, dto);
    return createResponse(lt);
  }

  @Get('leave-types')
  @ApiOperation({ summary: 'List leave types' })
  async listLeaveTypes(@CurrentUser() user: JwtPayload) {
    const data = await this.hrService.listLeaveTypes(user.organizationId);
    return createResponse(data);
  }

  @Post('leave-requests')
  @ApiOperation({ summary: 'Create leave request' })
  async createLeaveRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const request = await this.hrService.createLeaveRequest(
      user.organizationId,
      dto,
    );
    return createResponse(request);
  }

  @Post('leave-requests/:id/approve')
  @ApiOperation({ summary: 'Approve leave request' })
  async approveLeaveRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const request = await this.hrService.approveLeaveRequest(
      user.organizationId,
      id,
      user.sub,
    );
    return createResponse(request);
  }

  @Post('leave-requests/:id/reject')
  @ApiOperation({ summary: 'Reject leave request' })
  async rejectLeaveRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const request = await this.hrService.rejectLeaveRequest(
      user.organizationId,
      id,
      user.sub,
    );
    return createResponse(request);
  }

  @Get('leave-requests')
  @ApiOperation({ summary: 'List leave requests' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  async listLeaveRequests(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const result = await this.hrService.listLeaveRequests(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      employeeId,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== ADVANCES =====

  @Post('advances')
  @ApiOperation({ summary: 'Create employee advance' })
  async createAdvance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAdvanceDto,
  ) {
    const advance = await this.hrService.createAdvance(
      user.organizationId,
      dto,
    );
    return createResponse(advance);
  }

  @Post('advances/:id/approve')
  @ApiOperation({ summary: 'Approve employee advance' })
  async approveAdvance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const advance = await this.hrService.approveAdvance(
      user.organizationId,
      id,
      user.sub,
    );
    return createResponse(advance);
  }

  @Get('advances')
  @ApiOperation({ summary: 'List advances' })
  @ApiQuery({ name: 'employeeId', required: false })
  async listAdvances(
    @CurrentUser() user: JwtPayload,
    @Query('employeeId') employeeId?: string,
  ) {
    const data = await this.hrService.listAdvances(
      user.organizationId,
      employeeId,
    );
    return createResponse(data);
  }

  // ===== SALARY SLIPS & PAYROLL =====

  @Post('salary-slips/generate')
  @ApiOperation({ summary: 'Generate salary slip for an employee' })
  async generateSalarySlip(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateSalarySlipDto,
  ) {
    const slip = await this.hrService.generateSalarySlip(
      user.organizationId,
      dto,
    );
    return createResponse(slip);
  }

  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll for all active employees' })
  async generatePayroll(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GeneratePayrollDto,
  ) {
    const result = await this.hrService.generatePayroll(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Post('salary-slips/:id/confirm')
  @ApiOperation({ summary: 'Confirm salary slip' })
  async confirmSalarySlip(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const slip = await this.hrService.confirmSalarySlip(
      user.organizationId,
      id,
    );
    return createResponse(slip);
  }

  @Post('salary-slips/:id/pay')
  @ApiOperation({ summary: 'Process salary payment with journal entry' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async processSalaryPayment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const slip = await this.hrService.processSalaryPayment(
      user.organizationId,
      user.sub,
      id,
      fiscalYearId,
    );
    return createResponse(slip);
  }

  @Get('salary-slips')
  @ApiOperation({ summary: 'List salary slips' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  async listSalarySlips(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const result = await this.hrService.listSalarySlips(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }
}
