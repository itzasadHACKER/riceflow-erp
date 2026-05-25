import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SalespersonService } from './salesperson.service';
import { CreateSalespersonDto, AssignPartyDto, RecordSaleDto } from './dto/salesperson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Salesperson')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('salespersons')
export class SalespersonController {
  constructor(private readonly salespersonService: SalespersonService) {}

  @Post()
  @ApiOperation({ summary: 'Create salesperson' })
  async create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateSalespersonDto) {
    const data = await this.salespersonService.create(user.organizationId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List salespersons' })
  async findAll(@CurrentUser() user: { organizationId: string }) {
    const data = await this.salespersonService.findAll(user.organizationId);
    return { success: true, data };
  }

  @Get('team-report')
  @ApiOperation({ summary: 'Team sales report' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'mtd', 'ytd'] })
  async teamReport(@CurrentUser() user: { organizationId: string }, @Query('period') period = 'mtd') {
    const data = await this.salespersonService.getTeamReport(user.organizationId, period);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salesperson' })
  async findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.salespersonService.findOne(user.organizationId, id);
    return { success: true, data };
  }

  @Post(':id/assign-party')
  @ApiOperation({ summary: 'Assign customer/party to salesperson' })
  async assignParty(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: AssignPartyDto) {
    const data = await this.salespersonService.assignParty(user.organizationId, id, dto);
    return { success: true, data };
  }

  @Delete(':id/remove-party/:customerId')
  @ApiOperation({ summary: 'Remove party from salesperson' })
  async removeParty(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Param('customerId') customerId: string) {
    const data = await this.salespersonService.removeParty(user.organizationId, id, customerId);
    return { success: true, data };
  }

  @Post(':id/record-sale')
  @ApiOperation({ summary: 'Record sale for salesperson' })
  async recordSale(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Body() dto: RecordSaleDto) {
    const data = await this.salespersonService.recordSale(user.organizationId, id, dto);
    return { success: true, data };
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Sales report by salesperson (YTD/MTD/Daily)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'mtd', 'ytd'] })
  async report(@CurrentUser() user: { organizationId: string }, @Param('id') id: string, @Query('period') period = 'mtd') {
    const data = await this.salespersonService.getSalesReport(user.organizationId, id, period);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete salesperson' })
  async delete(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.salespersonService.delete(user.organizationId, id);
    return { success: true, data };
  }
}
