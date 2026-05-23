import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinanceService } from '../finance/finance.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import {
  MarkAttendanceDto,
  CreateLeaveTypeDto,
  CreateLeaveRequestDto,
  CreateAdvanceDto,
  GenerateSalarySlipDto,
  GeneratePayrollDto,
} from './dto/attendance.dto';

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  // ===== EMPLOYEES =====

  async createEmployee(organizationId: string, dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({
      where: {
        organizationId_employeeCode: {
          organizationId,
          employeeCode: dto.employeeCode,
        },
      },
    });
    if (existing)
      throw new ConflictException(
        `Employee code ${dto.employeeCode} already exists`,
      );

    return this.prisma.employee.create({
      data: {
        organizationId,
        employeeCode: dto.employeeCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        userId: dto.userId,
        phone: dto.phone,
        email: dto.email,
        cnic: dto.cnic,
        designation: dto.designation,
        employmentType: dto.employmentType ?? 'FULL_TIME',
        joinDate: new Date(dto.joinDate),
        baseSalary: dto.baseSalary ?? 0,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
      },
      include: { branch: true, department: true },
    });
  }

  async listEmployees(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ) {
    const where = {
      organizationId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              {
                employeeCode: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: { branch: true, department: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getEmployee(organizationId: string, id: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { branch: true, department: true, user: true },
    });
    if (!emp) throw new NotFoundException('Employee not found');
    return emp;
  }

  async updateEmployee(
    organizationId: string,
    id: string,
    dto: UpdateEmployeeDto,
  ) {
    await this.getEmployee(organizationId, id);
    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        exitDate: dto.exitDate ? new Date(dto.exitDate) : undefined,
      },
      include: { branch: true, department: true },
    });
  }

  // ===== ATTENDANCE =====

  async markAttendance(organizationId: string, dto: MarkAttendanceDto) {
    const employee = await this.getEmployee(organizationId, dto.employeeId);
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.attendanceRecord.upsert({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: new Date(dto.date),
        },
      },
      create: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        status: dto.status ?? 'PRESENT',
        checkIn: dto.checkIn ? new Date(dto.checkIn) : null,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : null,
        overtimeHours: dto.overtimeHours,
        notes: dto.notes,
      },
      update: {
        status: dto.status ?? 'PRESENT',
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        overtimeHours: dto.overtimeHours,
        notes: dto.notes,
      },
    });
  }

  async getAttendance(
    organizationId: string,
    employeeId: string,
    month: number,
    year: number,
  ) {
    await this.getEmployee(organizationId, employeeId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getAttendanceSummary(
    organizationId: string,
    employeeId: string,
    month: number,
    year: number,
  ) {
    const records = await this.getAttendance(
      organizationId,
      employeeId,
      month,
      year,
    );

    const summary = {
      present: 0,
      absent: 0,
      halfDay: 0,
      leave: 0,
      holiday: 0,
      totalOvertimeHours: 0,
      totalDays: records.length,
    };

    for (const record of records) {
      switch (record.status) {
        case 'PRESENT':
          summary.present++;
          break;
        case 'ABSENT':
          summary.absent++;
          break;
        case 'HALF_DAY':
          summary.halfDay++;
          break;
        case 'LEAVE':
          summary.leave++;
          break;
        case 'HOLIDAY':
          summary.holiday++;
          break;
      }
      summary.totalOvertimeHours += Number(record.overtimeHours ?? 0);
    }

    return summary;
  }

  // ===== LEAVE MANAGEMENT =====

  async createLeaveType(organizationId: string, dto: CreateLeaveTypeDto) {
    return this.prisma.leaveType.create({
      data: {
        organizationId,
        name: dto.name,
        daysAllowed: dto.daysAllowed,
        isPaid: dto.isPaid ?? true,
      },
    });
  }

  async listLeaveTypes(organizationId: string) {
    return this.prisma.leaveType.findMany({
      where: { organizationId, isActive: true },
    });
  }

  async createLeaveRequest(organizationId: string, dto: CreateLeaveRequestDto) {
    await this.getEmployee(organizationId, dto.employeeId);

    const leaveType = await this.prisma.leaveType.findFirst({
      where: { id: dto.leaveTypeId, organizationId },
    });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    const year = new Date(dto.fromDate).getFullYear();
    const usedLeaves = await this.prisma.leaveRequest.aggregate({
      where: {
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        status: { in: ['PENDING', 'APPROVED'] },
        fromDate: { gte: new Date(year, 0, 1) },
        toDate: { lte: new Date(year, 11, 31) },
      },
      _sum: { days: true },
    });

    const totalUsed = usedLeaves._sum.days ?? 0;
    if (totalUsed + dto.days > leaveType.daysAllowed) {
      throw new BadRequestException(
        `Leave limit exceeded. Used: ${totalUsed}, Requesting: ${dto.days}, Allowed: ${leaveType.daysAllowed}`,
      );
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        days: dto.days,
        reason: dto.reason,
      },
      include: { leaveType: true },
    });
  }

  async approveLeaveRequest(
    organizationId: string,
    id: string,
    userId: string,
  ) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.employee.organizationId !== organizationId) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Only pending requests can be approved');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
      include: { leaveType: true },
    });
  }

  async rejectLeaveRequest(organizationId: string, id: string, userId: string) {
    const request = await this.prisma.leaveRequest.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException('Leave request not found');
    if (request.employee.organizationId !== organizationId) {
      throw new NotFoundException('Leave request not found');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED', approvedBy: userId },
    });
  }

  async listLeaveRequests(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    employeeId?: string,
  ) {
    const where = {
      employee: { organizationId },
      ...(employeeId ? { employeeId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: { employee: true, leaveType: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ===== ADVANCES =====

  async createAdvance(organizationId: string, dto: CreateAdvanceDto) {
    await this.getEmployee(organizationId, dto.employeeId);

    return this.prisma.employeeAdvance.create({
      data: {
        employeeId: dto.employeeId,
        amount: dto.amount,
        reason: dto.reason,
      },
      include: { employee: true },
    });
  }

  async approveAdvance(organizationId: string, id: string, userId: string) {
    const advance = await this.prisma.employeeAdvance.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!advance) throw new NotFoundException('Advance not found');
    if (advance.employee.organizationId !== organizationId) {
      throw new NotFoundException('Advance not found');
    }
    if (advance.status !== 'PENDING') {
      throw new BadRequestException('Only pending advances can be approved');
    }

    return this.prisma.employeeAdvance.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
    });
  }

  async listAdvances(organizationId: string, employeeId?: string) {
    return this.prisma.employeeAdvance.findMany({
      where: {
        employee: { organizationId },
        ...(employeeId ? { employeeId } : {}),
      },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===== SALARY SLIPS & PAYROLL =====

  async generateSalarySlip(organizationId: string, dto: GenerateSalarySlipDto) {
    const employee = await this.getEmployee(organizationId, dto.employeeId);

    const existing = await this.prisma.salarySlip.findUnique({
      where: {
        employeeId_month_year: {
          employeeId: dto.employeeId,
          month: dto.month,
          year: dto.year,
        },
      },
    });
    if (existing)
      throw new ConflictException('Salary slip already exists for this period');

    const attendanceSummary = await this.getAttendanceSummary(
      organizationId,
      dto.employeeId,
      dto.month,
      dto.year,
    );

    const baseSalary = Number(employee.baseSalary);
    const workingDays = 26;
    const effectiveDays =
      attendanceSummary.present + attendanceSummary.halfDay * 0.5;
    const dailyRate = baseSalary / workingDays;

    const earnedSalary = Math.round(dailyRate * effectiveDays * 100) / 100;
    const overtimeRate = (dailyRate / 8) * 1.5;
    const overtimeAmount =
      Math.round(overtimeRate * attendanceSummary.totalOvertimeHours * 100) /
      100;

    const approvedAdvances = await this.prisma.employeeAdvance.findMany({
      where: {
        employeeId: dto.employeeId,
        status: 'APPROVED',
        deductedInSlipId: null,
      },
    });
    const totalAdvanceDeduction = approvedAdvances.reduce(
      (sum, adv) => sum + Number(adv.amount),
      0,
    );

    const allowances = { basic: earnedSalary };
    const deductions = {
      advances: totalAdvanceDeduction,
      absentDeduction:
        Math.round(dailyRate * attendanceSummary.absent * 100) / 100,
    };

    const grossSalary = earnedSalary + overtimeAmount;
    const totalDeductions = totalAdvanceDeduction + deductions.absentDeduction;
    const netSalary = grossSalary - totalDeductions;

    return this.prisma.$transaction(async (tx) => {
      const slip = await tx.salarySlip.create({
        data: {
          employeeId: dto.employeeId,
          month: dto.month,
          year: dto.year,
          baseSalary,
          allowances,
          deductions,
          overtimeAmount,
          grossSalary,
          netSalary,
        },
        include: { employee: true },
      });

      for (const advance of approvedAdvances) {
        await tx.employeeAdvance.update({
          where: { id: advance.id },
          data: { status: 'DEDUCTED', deductedInSlipId: slip.id },
        });
      }

      return slip;
    });
  }

  async generatePayroll(organizationId: string, dto: GeneratePayrollDto) {
    const employees = await this.prisma.employee.findMany({
      where: { organizationId, isActive: true, deletedAt: null },
    });

    const results: {
      employeeCode: string;
      employeeName: string;
      status: string;
      error?: string;
    }[] = [];

    for (const emp of employees) {
      try {
        await this.generateSalarySlip(organizationId, {
          employeeId: emp.id,
          month: dto.month,
          year: dto.year,
        });
        results.push({
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          status: 'SUCCESS',
        });
      } catch (error) {
        results.push({
          employeeCode: emp.employeeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      month: dto.month,
      year: dto.year,
      totalEmployees: employees.length,
      successful: results.filter((r) => r.status === 'SUCCESS').length,
      failed: results.filter((r) => r.status === 'FAILED').length,
      results,
    };
  }

  async confirmSalarySlip(organizationId: string, id: string) {
    const slip = await this.prisma.salarySlip.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!slip) throw new NotFoundException('Salary slip not found');
    if (slip.employee.organizationId !== organizationId) {
      throw new NotFoundException('Salary slip not found');
    }
    if (slip.status !== 'DRAFT') {
      throw new BadRequestException('Only draft slips can be confirmed');
    }

    return this.prisma.salarySlip.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: { employee: true },
    });
  }

  async processSalaryPayment(
    organizationId: string,
    userId: string,
    id: string,
    fiscalYearId: string,
  ) {
    const slip = await this.prisma.salarySlip.findFirst({
      where: { id },
      include: { employee: true },
    });
    if (!slip) throw new NotFoundException('Salary slip not found');
    if (slip.employee.organizationId !== organizationId) {
      throw new NotFoundException('Salary slip not found');
    }
    if (slip.status !== 'CONFIRMED') {
      throw new BadRequestException('Only confirmed slips can be paid');
    }

    return this.prisma.$transaction(async (tx) => {
      const salaryExpAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '5210' },
      });
      const salaryPayableAccount = await tx.chartOfAccount.findFirst({
        where: { organizationId, code: '2140' },
      });

      if (!salaryExpAccount || !salaryPayableAccount) {
        throw new NotFoundException(
          'Salary accounts not found in COA. Seed chart of accounts first.',
        );
      }

      const count = await tx.journalEntry.count({ where: { organizationId } });
      const entryNumber = `JE-${String(count + 1).padStart(6, '0')}`;

      const journalEntry = await tx.journalEntry.create({
        data: {
          organizationId,
          entryNumber,
          date: new Date(),
          reference: `SAL-${slip.employee.employeeCode}-${slip.month}/${slip.year}`,
          narration: `Salary payment for ${slip.employee.firstName} ${slip.employee.lastName} - ${slip.month}/${slip.year}`,
          entryType: 'SYSTEM',
          fiscalYearId,
          createdBy: userId,
          isPosted: true,
          postedBy: userId,
          postedAt: new Date(),
          lines: {
            create: [
              {
                accountId: salaryExpAccount.id,
                debit: Number(slip.grossSalary),
                credit: 0,
                narration: 'Salary expense',
              },
              {
                accountId: salaryPayableAccount.id,
                debit: 0,
                credit: Number(slip.netSalary),
                narration: 'Net salary payable',
              },
            ],
          },
        },
      });

      return tx.salarySlip.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          journalEntryId: journalEntry.id,
        },
        include: { employee: true },
      });
    });
  }

  async listSalarySlips(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
    month?: number,
    year?: number,
  ) {
    const where = {
      employee: { organizationId },
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.salarySlip.findMany({
        where,
        include: { employee: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.salarySlip.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}
