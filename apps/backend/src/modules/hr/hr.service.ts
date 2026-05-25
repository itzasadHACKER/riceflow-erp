import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
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
        middleName: dto.middleName,
        lastName: dto.lastName,
        fullName: dto.employeeName || `${dto.firstName} ${dto.lastName}`,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        maritalStatus: dto.maritalStatus,
        bloodGroup: dto.bloodGroup,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        userId: dto.userId,
        phone: dto.phone,
        mobileNo: dto.cellPhone,
        personalEmail: dto.personalEmail,
        email: dto.email,
        cnic: dto.cnic,
        passportNo: dto.passportNumber,
        designation: dto.designation,
        reportsTo: dto.reportsTo,
        employmentType: dto.employmentType ?? 'FULL_TIME',
        joinDate: new Date(dto.joinDate),
        confirmationDate: dto.confirmationDate ? new Date(dto.confirmationDate) : undefined,
        contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : undefined,
        attendanceDeviceId: dto.attendanceDeviceId,
        baseSalary: dto.baseSalary ?? 0,
        salaryMode: dto.salaryMode,
        payrollCostCenterId: dto.payrollCostCenterId,
        defaultShift: dto.defaultShift,
        holidayList: dto.holidayList,
        bankAccount: dto.bankAccount,
        bankName: dto.bankName,
        iban: dto.iban,
        healthInsuranceNo: dto.healthInsuranceNo,
        healthInsurance: dto.healthInsuranceProvider,
        address: dto.address,
        permanentAddress: dto.permanentAddress,
        emergencyContact: dto.emergencyContact,
        emergencyContactName: dto.emergencyContactName,
        imageUrl: dto.imageUrl,
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

  // ============================================================================
  // EMPLOYEE DOCUMENTS
  // ============================================================================

  async addEmployeeDocument(
    organizationId: string,
    employeeId: string,
    data: { documentType: string; title: string; fileUrl?: string; fileName?: string; expiryDate?: string; notes?: string },
  ) {
    return this.prisma.employeeDocument.create({
      data: {
        organizationId,
        employeeId,
        documentType: data.documentType,
        title: data.title,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        notes: data.notes,
      },
    });
  }

  async getEmployeeDocuments(organizationId: string, employeeId: string) {
    return this.prisma.employeeDocument.findMany({
      where: { organizationId, employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDocument(organizationId: string, docId: string, verifiedBy: string) {
    return this.prisma.employeeDocument.update({
      where: { id: docId },
      data: { isVerified: true, verifiedBy },
    });
  }

  async getExpiringDocuments(organizationId: string, daysAhead: number) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    return this.prisma.employeeDocument.findMany({
      where: {
        organizationId,
        expiryDate: { lte: futureDate, gte: new Date() },
      },
      include: { employee: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ============================================================================
  // EMPLOYEE LOANS
  // ============================================================================

  async createLoan(
    organizationId: string,
    data: {
      employeeId: string;
      loanType: string;
      principalAmount: string;
      interestRate?: string;
      monthlyDeduction: string;
      disbursementDate: string;
      approvedBy?: string;
      notes?: string;
    },
  ) {
    const series = await this.prisma.numberingSeries.findFirst({
      where: { organizationId, entityType: 'LOAN' },
    });
    const currentNumber = series ? series.currentNumber + 1 : 1;
    const loanNumber = `LN-${String(currentNumber).padStart(6, '0')}`;
    if (series) {
      await this.prisma.numberingSeries.update({ where: { id: series.id }, data: { currentNumber } });
    }

    const principal = parseFloat(data.principalAmount);
    const rate = parseFloat(data.interestRate ?? '0');
    const totalRepayable = principal + (principal * rate) / 100;

    return this.prisma.employeeLoan.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        loanNumber,
        loanType: data.loanType,
        principalAmount: new Prisma.Decimal(principal),
        interestRate: new Prisma.Decimal(rate),
        totalRepayable: new Prisma.Decimal(totalRepayable),
        monthlyDeduction: new Prisma.Decimal(data.monthlyDeduction),
        remainingAmount: new Prisma.Decimal(totalRepayable),
        disbursementDate: new Date(data.disbursementDate),
        approvedBy: data.approvedBy,
        notes: data.notes,
      },
    });
  }

  async getLoans(organizationId: string, employeeId?: string) {
    const where: Prisma.EmployeeLoanWhereInput = { organizationId };
    if (employeeId) where.employeeId = employeeId;
    return this.prisma.employeeLoan.findMany({
      where,
      include: { employee: true, repayments: { orderBy: { paymentDate: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordLoanRepayment(loanId: string, amount: string, paymentDate: string, salarySlipId?: string) {
    const loan = await this.prisma.employeeLoan.findFirst({ where: { id: loanId } });
    if (!loan) throw new NotFoundException('Loan not found');

    const paymentAmount = parseFloat(amount);
    const interest = (Number(loan.remainingAmount) * Number(loan.interestRate)) / (100 * 12);
    const principalPaid = paymentAmount - interest;
    const newRemaining = Number(loan.remainingAmount) - principalPaid;

    return this.prisma.$transaction(async (tx) => {
      await tx.loanRepayment.create({
        data: {
          loanId,
          amount: new Prisma.Decimal(paymentAmount),
          principal: new Prisma.Decimal(principalPaid > 0 ? principalPaid : paymentAmount),
          interest: new Prisma.Decimal(interest > 0 ? interest : 0),
          paymentDate: new Date(paymentDate),
          salarySlipId,
        },
      });

      return tx.employeeLoan.update({
        where: { id: loanId },
        data: {
          totalPaid: { increment: new Prisma.Decimal(paymentAmount) },
          remainingAmount: new Prisma.Decimal(newRemaining > 0 ? newRemaining : 0),
          status: newRemaining <= 0 ? 'FULLY_PAID' : 'ACTIVE_LOAN',
        },
      });
    });
  }

  // ============================================================================
  // PERFORMANCE REVIEWS
  // ============================================================================

  async createPerformanceReview(
    organizationId: string,
    data: {
      employeeId: string;
      reviewPeriod: string;
      reviewDate: string;
      reviewerId?: string;
      goals?: Record<string, unknown>[];
      kpis?: Record<string, unknown>[];
      strengths?: string;
      improvements?: string;
      comments?: string;
    },
  ) {
    return this.prisma.performanceReview.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        reviewPeriod: data.reviewPeriod,
        reviewDate: new Date(data.reviewDate),
        reviewerId: data.reviewerId,
        goals: (data.goals ?? []) as Prisma.InputJsonValue,
        kpis: (data.kpis ?? []) as Prisma.InputJsonValue,
        strengths: data.strengths,
        improvements: data.improvements,
        comments: data.comments,
      },
    });
  }

  async getPerformanceReviews(organizationId: string, employeeId?: string) {
    const where: Prisma.PerformanceReviewWhereInput = { organizationId };
    if (employeeId) where.employeeId = employeeId;
    return this.prisma.performanceReview.findMany({
      where,
      include: { employee: true },
      orderBy: { reviewDate: 'desc' },
    });
  }

  async completeReview(organizationId: string, reviewId: string, overallRating: string) {
    return this.prisma.performanceReview.update({
      where: { id: reviewId },
      data: { status: 'COMPLETED', overallRating: new Prisma.Decimal(overallRating) },
    });
  }

  // ============================================================================
  // FINAL SETTLEMENT
  // ============================================================================

  async createFinalSettlement(
    organizationId: string,
    data: {
      employeeId: string;
      lastWorkingDay: string;
      notes?: string;
    },
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId },
      include: { loans: { where: { status: 'ACTIVE_LOAN' } }, advances: { where: { status: 'APPROVED' } } },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const pendingSalary = Number(employee.baseSalary);
    const loanBalance = employee.loans.reduce((s, l) => s + Number(l.remainingAmount), 0);
    const advanceBalance = employee.advances.reduce((s, a) => s + Number(a.amount), 0);
    const netPayable = pendingSalary - loanBalance - advanceBalance;

    return this.prisma.finalSettlement.create({
      data: {
        organizationId,
        employeeId: data.employeeId,
        settlementDate: new Date(),
        lastWorkingDay: new Date(data.lastWorkingDay),
        pendingSalary: new Prisma.Decimal(pendingSalary),
        loanBalance: new Prisma.Decimal(loanBalance),
        advanceBalance: new Prisma.Decimal(advanceBalance),
        netPayable: new Prisma.Decimal(netPayable > 0 ? netPayable : 0),
        notes: data.notes,
      },
    });
  }

  async getFinalSettlements(organizationId: string) {
    return this.prisma.finalSettlement.findMany({
      where: { organizationId },
      include: { employee: true },
      orderBy: { settlementDate: 'desc' },
    });
  }

  // ===================== EXPERIENCE LETTERS =====================

  async createExperienceLetterTemplate(organizationId: string, data: { name: string; template: string; isDefault?: boolean }) {
    if (data.isDefault) {
      await this.prisma.experienceLetterTemplate.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }
    return this.prisma.experienceLetterTemplate.create({
      data: {
        organizationId,
        name: data.name,
        template: data.template,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async getExperienceLetterTemplates(organizationId: string) {
    return this.prisma.experienceLetterTemplate.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async generateExperienceLetter(organizationId: string, employeeId: string, templateId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found');

    let template: string;
    if (templateId) {
      const tmpl = await this.prisma.experienceLetterTemplate.findFirst({ where: { id: templateId, organizationId } });
      if (!tmpl) throw new NotFoundException('Template not found');
      template = tmpl.template;
    } else {
      const defaultTmpl = await this.prisma.experienceLetterTemplate.findFirst({ where: { organizationId, isDefault: true } });
      template = defaultTmpl?.template ?? this.getDefaultExperienceLetterTemplate();
    }

    const joiningDate = employee.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const letter = template
      .replace(/\{\{companyName\}\}/g, org.name)
      .replace(/\{\{companyAddress\}\}/g, [org.address, org.city, org.state, org.country].filter(Boolean).join(', '))
      .replace(/\{\{companyPhone\}\}/g, org.phone ?? '')
      .replace(/\{\{companyEmail\}\}/g, org.email ?? '')
      .replace(/\{\{employeeName\}\}/g, `${employee.user?.firstName ?? ''} ${employee.user?.lastName ?? ''}`)
      .replace(/\{\{employeeId\}\}/g, employee.employeeCode)
      .replace(/\{\{designation\}\}/g, employee.designation ?? 'N/A')
      .replace(/\{\{department\}\}/g, employee.departmentId ?? 'N/A')
      .replace(/\{\{joiningDate\}\}/g, joiningDate)
      .replace(/\{\{currentDate\}\}/g, today)
      .replace(/\{\{logoUrl\}\}/g, org.logoUrl ?? '');

    return { letter, employee: { name: `${employee.user?.firstName ?? ''} ${employee.user?.lastName ?? ''}`, employeeCode: employee.employeeCode, designation: employee.designation }, organization: { name: org.name } };
  }

  private getDefaultExperienceLetterTemplate(): string {
    return `
EXPERIENCE LETTER

Date: {{currentDate}}

To Whom It May Concern,

This is to certify that Mr./Ms. {{employeeName}} (Employee ID: {{employeeId}}) has worked with {{companyName}} as {{designation}} from {{joiningDate}} to {{currentDate}}.

During the tenure, they have demonstrated excellent professional skills, dedication, and a strong work ethic. They were responsible, punctual, and maintained cordial relationships with colleagues and management.

We wish them all the best in future endeavors.

Sincerely,

___________________________
Authorized Signatory
{{companyName}}
{{companyAddress}}
    `.trim();
  }
}
