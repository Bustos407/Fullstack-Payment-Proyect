import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../application/products.service';
import { Product } from '../infrastructure/typeorm/product.entity';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos con stock disponible' })
  @ApiResponse({ status: 200, description: 'Lista de productos' })
  async findAll(): Promise<Product[]> {
    this.logger.log('GET /products - listar productos');
    const products = await this.productsService.findAll();
    this.logger.log(`GET /products - OK, ${products.length} producto(s): ${products.map((p) => `${p.name}(stock:${p.stock})`).join(', ')}`);
    return products;
  }
}

