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
import { ExpenseService } from './expense.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import {
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  CreateExpenseEntryDto,
  ExpenseFilterDto,
} from './dto/expense.dto';

@ApiTags('expense')
@Controller('expense')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post('categories')
  @ApiOperation({ summary: 'Create expense category' })
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseCategoryDto,
  ) {
    const result = await this.expenseService.createCategory(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List expense categories' })
  async getCategories(@CurrentUser() user: JwtPayload) {
    const result = await this.expenseService.getCategories(user.organizationId);
    return createResponse(result);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update expense category' })
  async updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ) {
    const result = await this.expenseService.updateCategory(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(result);
  }

  @Post('entries')
  @ApiOperation({ summary: 'Create expense entry with GL posting' })
  async createExpenseEntry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseEntryDto,
  ) {
    const result = await this.expenseService.createExpenseEntry(
      user.organizationId,
      dto,
      user.sub,
    );
    return createResponse(result);
  }

  @Get('entries')
  @ApiOperation({ summary: 'List expense entries' })
  async getExpenseEntries(
    @CurrentUser() user: JwtPayload,
    @Query() filter: ExpenseFilterDto,
  ) {
    const result = await this.expenseService.getExpenseEntries(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Expense summary report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getExpenseSummary(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.expenseService.getExpenseSummary(
      user.organizationId,
      startDate,
      endDate,
    );
    return createResponse(result);
  }
}
