import { Module, OnModuleInit } from '@nestjs/common';
import { ProductsDynamoRepository } from './infrastructure/dynamodb/products.dynamodb.repository';
import { ProductsService } from './application/products.service';
import { ProductsController } from './presentation/products.controller';

@Module({
  providers: [ProductsDynamoRepository, ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule implements OnModuleInit {
  constructor(private readonly productsService: ProductsService) {}

  async onModuleInit(): Promise<void> {
    await this.productsService.seedIfEmpty();
  }
}
