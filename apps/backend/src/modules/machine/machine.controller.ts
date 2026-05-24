import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import { MachineService } from './machine.service';
import { CreateMachineDto, CreateMaintenanceLogDto, CreateSpareDto, CreateDowntimeDto } from './dto/machine.dto';

interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  isSuperAdmin: boolean;
}

@ApiTags('Machine Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('machines')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Post()
  @ApiOperation({ summary: 'Create machine' })
  async createMachine(@CurrentUser() user: JwtPayload, @Body() dto: CreateMachineDto) {
    const result = await this.machineService.createMachine(user.organizationId, dto);
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List machines' })
  async getMachines(@CurrentUser() user: JwtPayload, @Query('status') status?: string) {
    const result = await this.machineService.getMachines(user.organizationId, status);
    return createResponse(result);
  }

  @Get('oee/:machineId')
  @ApiOperation({ summary: 'Get OEE for a machine' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getOEE(
    @CurrentUser() user: JwtPayload,
    @Param('machineId') machineId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.machineService.getOEE(user.organizationId, machineId, startDate, endDate);
    return createResponse(result);
  }

  @Get('spares/low-stock')
  @ApiOperation({ summary: 'Get low stock spare parts' })
  async getLowStockSpares(@CurrentUser() user: JwtPayload) {
    const result = await this.machineService.getLowStockSpares(user.organizationId);
    return createResponse(result);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Get maintenance logs' })
  async getMaintenanceLogs(@CurrentUser() user: JwtPayload, @Query('machineId') machineId?: string) {
    const result = await this.machineService.getMaintenanceLogs(user.organizationId, machineId);
    return createResponse(result);
  }

  @Get('spares/list')
  @ApiOperation({ summary: 'List spare parts' })
  async getSpares(@CurrentUser() user: JwtPayload, @Query('machineId') machineId?: string) {
    const result = await this.machineService.getSpares(user.organizationId, machineId);
    return createResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get machine by ID' })
  async getMachineById(@CurrentUser() user: JwtPayload, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.machineService.getMachineById(user.organizationId, id);
    return createResponse(result);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update machine status' })
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    const result = await this.machineService.updateMachineStatus(user.organizationId, id, status);
    return createResponse(result);
  }

  @Post('maintenance')
  @ApiOperation({ summary: 'Create maintenance log' })
  async createMaintenanceLog(@CurrentUser() user: JwtPayload, @Body() dto: CreateMaintenanceLogDto) {
    const result = await this.machineService.createMaintenanceLog(user.organizationId, dto);
    return createResponse(result);
  }

  @Post('spares')
  @ApiOperation({ summary: 'Add spare part' })
  async createSpare(@CurrentUser() user: JwtPayload, @Body() dto: CreateSpareDto) {
    const result = await this.machineService.createSpare(user.organizationId, dto);
    return createResponse(result);
  }

  @Post('downtime')
  @ApiOperation({ summary: 'Log downtime' })
  async createDowntime(@CurrentUser() user: JwtPayload, @Body() dto: CreateDowntimeDto) {
    const result = await this.machineService.createDowntime(user.organizationId, dto);
    return createResponse(result);
  }

  @Put('downtime/:id/resolve')
  @ApiOperation({ summary: 'Resolve downtime' })
  async resolveDowntime(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('resolution') resolution: string,
  ) {
    const result = await this.machineService.resolveDowntime(user.organizationId, id, resolution);
    return createResponse(result);
  }
}
