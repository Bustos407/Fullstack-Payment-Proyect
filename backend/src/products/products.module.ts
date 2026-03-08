import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './infrastructure/typeorm/product.entity';
import { ProductsService } from './application/products.service';
import { ProductsController } from './presentation/products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule implements OnModuleInit {
  constructor(private readonly productsService: ProductsService) {}

  async onModuleInit(): Promise<void> {
    await this.productsService.seedIfEmpty();
  }
}

