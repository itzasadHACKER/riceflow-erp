import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BomService } from './bom.service';
import { CreateBomDto } from './dto/bom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bill of Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bom')
export class BomController {
  constructor(private readonly bomService: BomService) {}

  @Post()
  @ApiOperation({ summary: 'Create BOM' })
  async create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateBomDto) {
    const data = await this.bomService.create(user.organizationId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List BOMs' })
  async findAll(@CurrentUser() user: { organizationId: string }) {
    const data = await this.bomService.findAll(user.organizationId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get BOM by ID' })
  async findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.bomService.findOne(user.organizationId, id);
    return { success: true, data };
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle BOM active status' })
  async toggle(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.bomService.toggleActive(user.organizationId, id);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete BOM' })
  async delete(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.bomService.delete(user.organizationId, id);
    return { success: true, data };
  }
}
