import {
  Controller,
  Get,
  Post,
  Put,
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
import { ProductionService } from './production.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import {
  createResponse,
  createPaginatedResponse,
} from '../../common/interfaces/api-response.interface';
import {
  CreateProductionBatchDto,
  CompleteBatchDto,
  CreateMillingRecordDto,
} from './dto/production.dto';

@ApiTags('production')
@Controller('production')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post('batches')
  @ApiOperation({ summary: 'Create production batch' })
  async createBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProductionBatchDto,
  ) {
    const batch = await this.productionService.createBatch(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(batch);
  }

  @Post('batches/:id/start')
  @ApiOperation({ summary: 'Start production batch' })
  async startBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const batch = await this.productionService.startBatch(
      user.organizationId,
      id,
    );
    return createResponse(batch);
  }

  @Post('batches/:id/complete')
  @ApiOperation({ summary: 'Complete batch with outputs and costs' })
  async completeBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteBatchDto,
  ) {
    const batch = await this.productionService.completeBatch(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(batch);
  }

  @Post('batches/:id/cancel')
  @ApiOperation({ summary: 'Cancel production batch' })
  async cancelBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const batch = await this.productionService.cancelBatch(
      user.organizationId,
      id,
    );
    return createResponse(batch);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List production batches' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'processType', required: false })
  async listBatches(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('processType') processType?: string,
  ) {
    const result = await this.productionService.listBatches(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
      processType,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get production batch by ID' })
  async getBatch(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const batch = await this.productionService.getBatch(
      user.organizationId,
      id,
    );
    return createResponse(batch);
  }

  @Post('milling-records')
  @ApiOperation({ summary: 'Create milling record' })
  async createMillingRecord(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMillingRecordDto,
  ) {
    const record = await this.productionService.createMillingRecord(
      user.organizationId,
      dto,
    );
    return createResponse(record);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get production summary' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProductionSummary(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const summary = await this.productionService.getProductionSummary(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(summary);
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create production plan' })
  async createPlan(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { planDate: string; targetQuantity: string; shift?: string; machineId?: string; riceVarietyId?: string; unit?: string; notes?: string },
  ) {
    const result = await this.productionService.createProductionPlan(user.organizationId, dto, user.sub);
    return createResponse(result);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List production plans' })
  async getPlans(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.productionService.getProductionPlans(user.organizationId, startDate, endDate);
    return createResponse(result);
  }

  @Put('plans/:id')
  @ApiOperation({ summary: 'Update plan actual quantity' })
  async updatePlanActual(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { actualQuantity: string; status: string },
  ) {
    const result = await this.productionService.updatePlanActual(user.organizationId, id, dto.actualQuantity, dto.status);
    return createResponse(result);
  }
}
