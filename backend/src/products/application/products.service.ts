import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsDynamoRepository } from '../infrastructure/dynamodb/products.dynamodb.repository';
import { ProductDomain } from '../domain/product.entity';

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsDynamoRepository,
  ) {}

  async findAll(): Promise<ProductResponse[]> {
    return this.productsRepository.findAll();
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async reserveStock(productId: number, units: number): Promise<ProductResponse> {
    if (units <= 0) {
      throw new BadRequestException('Units must be greater than zero');
    }

    const product = await this.findOne(productId);
    const domain = new ProductDomain({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
    });

    try {
      const updatedDomain = domain.reserveUnits(units);
      await this.productsRepository.updateStock(productId, updatedDomain.stock);

      return {
        ...product,
        stock: updatedDomain.stock,
      };
    } catch {
      throw new BadRequestException('There is not enough stock to complete the purchase');
    }
  }

  async seedIfEmpty(): Promise<void> {
    const count = await this.productsRepository.count();
    if (count > 0) {
      return;
    }

    const products: { id: number; name: string; description: string; price: string; stock: number }[] = [
      { id: 1, name: 'Premium subscription', description: 'Unlimited access to the platform for 1 month.', price: '20000.00', stock: 10 },
      { id: 2, name: 'Gift card', description: 'Digital gift card.', price: '50000.00', stock: 5 },
    ];

    for (const p of products) {
      await this.productsRepository.save(p);
    }
  }
}
