import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { SalesQuotationService } from './sales-quotation.service';
import { CreateSalesQuotationDto, CreateBlanketAgreementDto } from './dto/sales-quotation.dto';

@ApiTags('Sales Quotations & Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales-quotations')
export class SalesQuotationController {
  constructor(private readonly service: SalesQuotationService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSalesQuotationDto) { return this.service.createQuotation(user.organizationId, dto); }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) { return this.service.findAll(user.organizationId); }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.findOne(user.organizationId, id); }

  @Patch(':id/status')
  updateStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: string) { return this.service.updateStatus(user.organizationId, id, status); }

  @Post(':id/convert')
  convert(@CurrentUser() user: JwtPayload, @Param('id') id: string) { return this.service.convertToOrder(user.organizationId, id); }

  @Post('blanket-agreements')
  createAgreement(@CurrentUser() user: JwtPayload, @Body() dto: CreateBlanketAgreementDto) { return this.service.createBlanketAgreement(user.organizationId, dto); }

  @Get('blanket-agreements/list')
  findAgreements(@CurrentUser() user: JwtPayload, @Query('type') type?: string) { return this.service.findAllAgreements(user.organizationId, type); }

  @Patch('blanket-agreements/:id/status')
  updateAgreementStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: string) { return this.service.updateAgreementStatus(user.organizationId, id, status); }
}
