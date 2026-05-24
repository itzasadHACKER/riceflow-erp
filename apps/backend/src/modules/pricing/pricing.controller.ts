import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PricingService } from './pricing.service';
import { CreatePriceListDto, AddPriceListItemDto, CreateDiscountGroupDto, CreateSpecialPriceDto } from './dto/pricing.dto';

@ApiTags('Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtPayload) { return this.service.getSummary(user.organizationId); }

  @Post('price-lists')
  createPriceList(@CurrentUser() user: JwtPayload, @Body() dto: CreatePriceListDto) { return this.service.createPriceList(user.organizationId, dto); }

  @Get('price-lists')
  findAllPriceLists(@CurrentUser() user: JwtPayload) { return this.service.findAllPriceLists(user.organizationId); }

  @Post('price-lists/:id/items')
  addItem(@Param('id') id: string, @Body() dto: AddPriceListItemDto) { return this.service.addPriceListItem(id, dto); }

  @Post('discount-groups')
  createDiscountGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateDiscountGroupDto) { return this.service.createDiscountGroup(user.organizationId, dto); }

  @Get('discount-groups')
  findAllDiscountGroups(@CurrentUser() user: JwtPayload) { return this.service.findAllDiscountGroups(user.organizationId); }

  @Post('special-prices')
  createSpecialPrice(@CurrentUser() user: JwtPayload, @Body() dto: CreateSpecialPriceDto) { return this.service.createSpecialPrice(user.organizationId, dto); }

  @Get('special-prices')
  findAllSpecialPrices(@CurrentUser() user: JwtPayload) { return this.service.findAllSpecialPrices(user.organizationId); }

  @Get('item-price')
  getItemPrice(@CurrentUser() user: JwtPayload, @Query('itemCode') itemCode: string, @Query('partnerId') partnerId?: string, @Query('qty') qty?: string) { return this.service.getItemPrice(user.organizationId, itemCode, partnerId, qty ? Number(qty) : undefined); }
}
