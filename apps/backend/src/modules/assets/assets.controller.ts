import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { createResponse } from '../../common/interfaces/api-response.interface';
import {
  CreateFixedAssetDto,
  UpdateFixedAssetDto,
  DisposeAssetDto,
  RunDepreciationDto,
  AssetFilterDto,
} from './dto/asset.dto';

@ApiTags('assets')
@Controller('assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create fixed asset' })
  async createAsset(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFixedAssetDto,
  ) {
    const result = await this.assetsService.createAsset(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get()
  @ApiOperation({ summary: 'List assets' })
  async getAssets(
    @CurrentUser() user: JwtPayload,
    @Query() filter: AssetFilterDto,
  ) {
    const result = await this.assetsService.getAssets(
      user.organizationId,
      filter,
    );
    return createResponse(result);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Asset summary report' })
  async getAssetSummary(@CurrentUser() user: JwtPayload) {
    const result = await this.assetsService.getAssetSummary(
      user.organizationId,
    );
    return createResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get asset by ID' })
  async getAssetById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.assetsService.getAssetById(
      user.organizationId,
      id,
    );
    return createResponse(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update asset' })
  async updateAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFixedAssetDto,
  ) {
    const result = await this.assetsService.updateAsset(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(result);
  }

  @Post(':id/dispose')
  @ApiOperation({ summary: 'Dispose asset' })
  async disposeAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisposeAssetDto,
  ) {
    const result = await this.assetsService.disposeAsset(
      user.organizationId,
      id,
      dto,
    );
    return createResponse(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete asset (soft)' })
  async deleteAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.assetsService.deleteAsset(
      user.organizationId,
      id,
    );
    return createResponse(result);
  }

  @Post('depreciation/run')
  @ApiOperation({ summary: 'Run depreciation for all active assets' })
  async runDepreciation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RunDepreciationDto,
  ) {
    const result = await this.assetsService.runDepreciation(
      user.organizationId,
      dto,
    );
    return createResponse(result);
  }

  @Get(':id/depreciation-schedule')
  @ApiOperation({ summary: 'Get depreciation schedule for an asset' })
  async getDepreciationSchedule(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.assetsService.getDepreciationSchedule(
      user.organizationId,
      id,
    );
    return createResponse(result);
  }
}
