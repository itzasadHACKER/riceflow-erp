import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { BudgetingService } from './budgeting.service';
import { CreateBudgetDto, UpdateBudgetStatusDto } from './dto/budget.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Budgeting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetingController {
  constructor(private readonly budgetingService: BudgetingService) {}

  @Post()
  @ApiOperation({ summary: 'Create budget' })
  async createBudget(@CurrentUser() user: JwtPayload, @Body() dto: CreateBudgetDto) {
    const result = await this.budgetingService.createBudget(user.organizationId, dto);
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List budgets' })
  async getBudgets(@CurrentUser() user: JwtPayload, @Query('fiscalYearId') fiscalYearId?: string) {
    const result = await this.budgetingService.getBudgets(user.organizationId, fiscalYearId);
    return createResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  async getBudgetById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.budgetingService.getBudgetById(user.organizationId, id);
    return createResponse(result);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update budget status' })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetStatusDto,
  ) {
    const result = await this.budgetingService.updateStatus(user.organizationId, id, dto, user.sub);
    return createResponse(result);
  }

  @Get(':id/variance')
  @ApiOperation({ summary: 'Get budget vs actual variance report' })
  async getVariance(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.budgetingService.getBudgetVariance(user.organizationId, id);
    return createResponse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  async deleteBudget(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.budgetingService.deleteBudget(user.organizationId, id);
    return createResponse(result);
  }
}
