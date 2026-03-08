import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../application/products.service';
import { Product } from '../infrastructure/typeorm/product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con stock disponible' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }
}

