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
import { SalesService } from './sales.service';
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
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateSalesOrderDto,
  CreateSalesInvoiceDto,
  CreateDeliveryChallanDto,
} from './dto/sales.dto';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ===== CUSTOMERS =====

  @Post('customers')
  @ApiOperation({ summary: 'Create customer' })
  async createCustomer(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    const customer = await this.salesService.createCustomer(
      user.organizationId,
      dto,
    );
    return createResponse(customer);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listCustomers(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.salesService.listCustomers(
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

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer by ID' })
  async getCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const customer = await this.salesService.getCustomer(
      user.organizationId,
      id,
    );
    return createResponse(customer);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer' })
  async updateCustomer(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const customer = await this.salesService.updateCustomer(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(customer);
  }

  // ===== SALES ORDERS =====

  @Post('orders')
  @ApiOperation({ summary: 'Create sales order' })
  async createSalesOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSalesOrderDto,
  ) {
    const order = await this.salesService.createSalesOrder(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(order);
  }

  @Post('orders/:id/confirm')
  @ApiOperation({ summary: 'Confirm sales order' })
  async confirmOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.salesService.confirmSalesOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  @Post('orders/:id/dispatch')
  @ApiOperation({ summary: 'Mark order as dispatched' })
  async dispatchOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.salesService.dispatchSalesOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  @Post('orders/:id/deliver')
  @ApiOperation({ summary: 'Mark order as delivered' })
  async deliverOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.salesService.deliverSalesOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel sales order' })
  async cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.salesService.cancelSalesOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List sales orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listSalesOrders(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.salesService.listSalesOrders(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      customerId,
      status,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  async getSalesOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const order = await this.salesService.getSalesOrder(
      user.organizationId,
      id,
    );
    return createResponse(order);
  }

  // ===== INVOICES =====

  @Post('invoices')
  @ApiOperation({ summary: 'Create sales invoice' })
  async createInvoice(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSalesInvoiceDto,
  ) {
    const invoice = await this.salesService.createSalesInvoice(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(invoice);
  }

  @Post('invoices/:id/post-to-accounts')
  @ApiOperation({ summary: 'Post invoice to accounts (creates journal entry)' })
  @ApiQuery({ name: 'fiscalYearId', required: true })
  async postInvoiceToAccounts(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fiscalYearId') fiscalYearId: string,
  ) {
    const result = await this.salesService.postInvoiceToAccounts(
      user.organizationId,
      user.sub,
      id,
      fiscalYearId,
    );
    return createResponse(result);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List sales invoices' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  async listInvoices(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('customerId') customerId?: string,
  ) {
    const result = await this.salesService.listSalesInvoices(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      customerId,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== DELIVERY CHALLANS =====

  @Post('delivery-challans')
  @ApiOperation({ summary: 'Create delivery challan' })
  async createDeliveryChallan(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDeliveryChallanDto,
  ) {
    const challan = await this.salesService.createDeliveryChallan(
      user.organizationId,
      user.sub,
      dto,
    );
    return createResponse(challan);
  }

  @Post('delivery-challans/:id/deliver')
  @ApiOperation({ summary: 'Mark delivery challan as delivered' })
  async markChallanDelivered(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('receiverName') receiverName?: string,
  ) {
    const challan = await this.salesService.markChallanDelivered(
      user.organizationId,
      id,
      receiverName,
    );
    return createResponse(challan);
  }

  @Get('delivery-challans')
  @ApiOperation({ summary: 'List delivery challans' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async listDeliveryChallans(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.salesService.listDeliveryChallans(
      user.organizationId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return createPaginatedResponse(
      result.data,
      result.total,
      result.page,
      result.limit,
    );
  }

  // ===== SUMMARY =====

  @Get('summary')
  @ApiOperation({ summary: 'Get sales summary' })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getSalesSummary(
    @CurrentUser() user: JwtPayload,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    const summary = await this.salesService.getSalesSummary(
      user.organizationId,
      fromDate,
      toDate,
    );
    return createResponse(summary);
  }
}
