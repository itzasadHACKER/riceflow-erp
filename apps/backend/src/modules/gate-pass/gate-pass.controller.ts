import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GatePassService } from './gate-pass.service';
import { CreateGatePassDto, UpdateGatePassStatusDto } from './dto/gate-pass.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Gate Pass')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gate-pass')
export class GatePassController {
  constructor(private readonly gatePassService: GatePassService) {}

  @Post()
  @ApiOperation({ summary: 'Create gate pass' })
  async create(@CurrentUser() user: { organizationId: string; userId: string }, @Body() dto: CreateGatePassDto) {
    const data = await this.gatePassService.create(user.organizationId, dto, user.userId);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List gate passes' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@CurrentUser() user: { organizationId: string }, @Query('type') type?: string, @Query('status') status?: string) {
    const data = await this.gatePassService.findAll(user.organizationId, type, status);
    return { success: true, data };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Gate pass summary' })
  async summary(@CurrentUser() user: { organizationId: string }) {
    const data = await this.gatePassService.getSummary(user.organizationId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get gate pass by ID' })
  async findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.gatePassService.findOne(user.organizationId, id);
    return { success: true, data };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update gate pass status' })
  async updateStatus(@CurrentUser() user: { organizationId: string; userId: string }, @Param('id') id: string, @Body() dto: UpdateGatePassStatusDto) {
    const data = await this.gatePassService.updateStatus(user.organizationId, id, dto, user.userId);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete gate pass' })
  async delete(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.gatePassService.delete(user.organizationId, id);
    return { success: true, data };
  }
}
