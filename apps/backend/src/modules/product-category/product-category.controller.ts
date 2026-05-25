import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto, SetParameterValueDto } from './dto/product-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Product Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-categories')
export class ProductCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create product category' })
  async create(@CurrentUser() user: { organizationId: string }, @Body() dto: CreateProductCategoryDto) {
    const data = await this.categoryService.create(user.organizationId, dto);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List categories' })
  @ApiQuery({ name: 'module', required: false })
  async findAll(@CurrentUser() user: { organizationId: string }, @Query('module') module?: string) {
    const data = await this.categoryService.findAll(user.organizationId, module);
    return { success: true, data };
  }

  @Get('tree/:module')
  @ApiOperation({ summary: 'Get category tree for module' })
  async getTree(@CurrentUser() user: { organizationId: string }, @Param('module') module: string) {
    const data = await this.categoryService.getTree(user.organizationId, module);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.categoryService.findOne(user.organizationId, id);
    return { success: true, data };
  }

  @Post('parameter-value')
  @ApiOperation({ summary: 'Set parameter value for entity' })
  async setParameterValue(@CurrentUser() user: { organizationId: string }, @Body() dto: SetParameterValueDto) {
    const data = await this.categoryService.setParameterValue(user.organizationId, dto);
    return { success: true, data };
  }

  @Get('parameter-values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get parameter values for entity' })
  async getParameterValues(
    @CurrentUser() user: { organizationId: string },
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.categoryService.getParameterValues(user.organizationId, entityType, entityId);
    return { success: true, data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  async delete(@CurrentUser() user: { organizationId: string }, @Param('id') id: string) {
    const data = await this.categoryService.delete(user.organizationId, id);
    return { success: true, data };
  }
}
