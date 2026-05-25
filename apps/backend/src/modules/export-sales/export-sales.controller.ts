import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { ExportSalesService } from './export-sales.service';
import {
  CreateExportContractDto,
  CreateLCDto,
  UpdateLCStatusDto,
  CreateShippingDocDto,
} from './dto/export-sales.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Export Sales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('export-sales')
export class ExportSalesController {
  constructor(private readonly exportSalesService: ExportSalesService) {}

  @Post('contracts')
  @ApiOperation({ summary: 'Create export contract' })
  async createContract(@CurrentUser() user: JwtPayload, @Body() dto: CreateExportContractDto) {
    const result = await this.exportSalesService.createContract(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'List export contracts' })
  async getContracts(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const result = await this.exportSalesService.getContracts(user.organizationId, status);
    return createResponse(result);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get export contract by ID' })
  async getContractById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const result = await this.exportSalesService.getContractById(user.organizationId, id);
    return createResponse(result);
  }

  @Put('contracts/:id/status')
  @ApiOperation({ summary: 'Update contract status' })
  async updateContractStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const result = await this.exportSalesService.updateContractStatus(user.organizationId, id, status);
    return createResponse(result);
  }

  @Post('lc')
  @ApiOperation({ summary: 'Create Letter of Credit' })
  async createLC(@CurrentUser() user: JwtPayload, @Body() dto: CreateLCDto) {
    const result = await this.exportSalesService.createLC(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('lc')
  @ApiOperation({ summary: 'List Letters of Credit' })
  async getLCs(@CurrentUser() user: JwtPayload, @Query('contractId') contractId?: string) {
    const result = await this.exportSalesService.getLCs(user.organizationId, contractId);
    return createResponse(result);
  }

  @Put('lc/:id/status')
  @ApiOperation({ summary: 'Update LC status' })
  async updateLCStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLCStatusDto,
  ) {
    const result = await this.exportSalesService.updateLCStatus(user.organizationId, id, dto);
    return createResponse(result);
  }

  @Post('shipping-docs')
  @ApiOperation({ summary: 'Create shipping document' })
  async createShippingDoc(@CurrentUser() user: JwtPayload, @Body() dto: CreateShippingDocDto) {
    const result = await this.exportSalesService.createShippingDoc(user.organizationId, dto);
    return createResponse(result);
  }

  @Get('shipping-docs')
  @ApiOperation({ summary: 'List shipping documents' })
  async getShippingDocs(@CurrentUser() user: JwtPayload, @Query('contractId') contractId?: string) {
    const result = await this.exportSalesService.getShippingDocs(user.organizationId, contractId);
    return createResponse(result);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Export sales dashboard' })
  async getDashboard(@CurrentUser() user: JwtPayload) {
    const result = await this.exportSalesService.getExportDashboard(user.organizationId);
    return createResponse(result);
  }
}
