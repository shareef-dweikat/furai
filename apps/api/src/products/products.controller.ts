import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import type { ProductDetails, ProductSummary } from '@furai/shared';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(): ProductSummary[] {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): ProductDetails {
    return this.productsService.findOne(id);
  }
}
