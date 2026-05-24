import { Module } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';

@Module({
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService],
  exports: [ProductCategoryService],
})
export class ProductCategoryModule {}
