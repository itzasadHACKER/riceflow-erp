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
import { ProcurementService } from './procurement.service';
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
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateRiceVarietyDto,
  CreatePaddyPurchaseDto,
  CreatePurchaseRateDto,
  CreateQualityTestDto,
  CreatePurchaseOrderDto,
} from './dto/procurement.dto';
import { CreateGoodsReceiptDto } from '../inventory/dto/inventory.dto';

@ApiTags('procurement')
@Controller('procurement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  // ===== SUPPLIERS =====

  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier' })
  async createSupplier(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSupplierDto,
  ) {
    const supplier = await this.procurementService.createSupplier(
      user.organizationId,
      dto,
    );
    return createResponse(supplier);
  }

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listSuppliers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.procurementService.listSuppliers(
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

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  async getSupplier(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const supplier = await this.procurementService.getSupplier(
      user.organizationId,
      id,
    );
    return createResponse(supplier);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier' })
  async updateSupplier(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    const supplier = await this.procurementService.updateSupplier(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(supplier);
  }

  // ===== RICE VARIETIES =====

  @Post('rice-varieties')
  @ApiOperation({ summary: 'Create rice variety' })
  async createRiceVariety(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRiceVarietyDto,
  ) {
    const variety = await this.procurementService.createRiceVariety(
      user.organizationId,
      dto,
    );
    return createResponse(variety);
  }

  @Get('rice-varieties')
  @ApiOperation({ summary: 'List rice varieties' })
  async listRiceVarieties(@CurrentUser() user: JwtPayload) {
    const data = await this.procurementService.listRiceVarieties(
      user.organizationId,
    );
    return createResponse(data);
  }

  @Get('rice-varieties/:id')
  @ApiOperation({ summary: 'Get rice variety by ID' })
  async getRiceVariety(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const variety = await this.procurementService.getRiceVariety(
      user.organizationId,
      id,
    );
    return createResponse(variety);
  }

  // ===== PADDY PURCHASES =====

  @Post('paddy-purchases')
  @ApiOperation({
    summary: 'Create paddy purchase with weight/moisture calculations',
  })
  async createPaddyPurchase(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaddyPurchaseDto,
  ) {
    const purchase = await this.procurementService.createPaddyPurchase(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(purchase);
  }

  @Post('paddy-purchases/:id/post-to-accounts')
  @ApiOperation({
    summary: 'Post purchase to accounts (creates journal entry)',
  })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async postPurchaseToAccounts(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const result = await this.procurementService.postPurchaseToAccounts(
      user.organizationId,
      user.sub,
      id,
      fiscalYearId,
    );
    return createResponse(result);
  }

  @Get('paddy-purchases')
  @ApiOperation({ summary: 'List paddy purchases' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  async listPaddyPurchases(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('supplierId') supplierId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.procurementService.listPaddyPurchases(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      supplierId,
      fromDate,
      toDate,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('paddy-purchases/:id')
  @ApiOperation({ summary: 'Get paddy purchase by ID' })
  async getPaddyPurchase(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const purchase = await this.procurementService.getPaddyPurchase(
      user.organizationId,
      id,
    );
    return createResponse(purchase);
  }

  // ===== PURCHASE RATES =====

  @Post('purchase-rates')
  @ApiOperation({ summary: 'Set purchase rate for rice variety' })
  async createPurchaseRate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePurchaseRateDto,
  ) {
    const rate = await this.procurementService.createPurchaseRate(
      user.organizationId,
      dto,
    );
    return createResponse(rate);
  }

  @Get('purchase-rates/current/:riceVarietyId')
  @ApiOperation({ summary: 'Get current rate for a rice variety' })
  async getCurrentRate(
    @CurrentUser() user: JwtPayload,
    @Param('riceVarietyId', ParseUUIDPipe) riceVarietyId: string,
  ) {
    const rate = await this.procurementService.getCurrentRate(
      user.organizationId,
      riceVarietyId,
    );
    return createResponse(rate);
  }

  @Get('purchase-rates')
  @ApiOperation({ summary: 'List purchase rates' })
  @ApiQuery({ name: 'riceVarietyId', required: false })
  async listPurchaseRates(
    @CurrentUser() user: JwtPayload,
    @Query('riceVarietyId') riceVarietyId?: string,
  ) {
    const data = await this.procurementService.listPurchaseRates(
      user.organizationId,
      riceVarietyId,
    );
    return createResponse(data);
  }

  // ===== QUALITY TESTS =====

  @Post('quality-tests')
  @ApiOperation({ summary: 'Create quality test for a purchase' })
  async createQualityTest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQualityTestDto,
  ) {
    const test = await this.procurementService.createQualityTest(
      user.organizationId,
      dto,
    );
    return createResponse(test);
  }

  @Get('quality-tests/:purchaseId')
  @ApiOperation({ summary: 'Get quality tests for a purchase' })
  async getQualityTests(
    @CurrentUser() user: JwtPayload,
    @Param('purchaseId', ParseUUIDPipe) purchaseId: string,
  ) {
    const tests = await this.procurementService.getQualityTests(
      user.organizationId,
      purchaseId,
    );
    return createResponse(tests);
  }

  // ===== PURCHASE ORDERS =====

  @Post('purchase-orders')
  @ApiOperation({ summary: 'Create purchase order' })
  async createPurchaseOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    const order = await this.procurementService.createPurchaseOrder(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(order);
  }

  @Get('purchase-orders')
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listPurchaseOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.procurementService.listPurchaseOrders(
      user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return createPaginatedResponse(result.data, result.total, result.page, result.limit);
  }

  @Get('purchase-orders/:id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  async getPurchaseOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.procurementService.getPurchaseOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  // ===== GOODS RECEIPTS =====

  @Post('goods-receipts')
  @ApiOperation({ summary: 'Create goods receipt (GRN)' })
  async createGoodsReceipt(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGoodsReceiptDto,
  ) {
    const receipt = await this.procurementService.createGoodsReceipt(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(receipt);
  }

  @Get('goods-receipts')
  @ApiOperation({ summary: 'List goods receipts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listGoodsReceipts(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.procurementService.listGoodsReceipts(
      user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return createPaginatedResponse(result.data, result.total, result.page, result.limit);
  }

  // ===== SUMMARY =====

  @Get('summary')
  @ApiOperation({ summary: 'Get procurement summary' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getProcurementSummary(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const summary = await this.procurementService.getProcurementSummary(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(summary);
  }
}
