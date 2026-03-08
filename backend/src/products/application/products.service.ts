import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../infrastructure/typeorm/product.entity';
import { ProductDomain } from '../domain/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find();
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    return product;
  }

  async reserveStock(productId: number, units: number): Promise<Product> {
    if (units <= 0) {
      throw new BadRequestException('Las unidades deben ser mayores que cero');
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

      const updated = await this.productsRepository.save({
        ...product,
        stock: updatedDomain.stock,
      });

      return updated;
    } catch (error) {
      throw new BadRequestException('No hay stock suficiente para completar la compra');
    }
  }

  async seedIfEmpty(): Promise<void> {
    const count = await this.productsRepository.count();
    if (count > 0) {
      return;
    }

    const products = this.productsRepository.create([
      {
        name: 'Suscripción Premium',
        description: 'Acceso ilimitado a la plataforma por 1 mes.',
        price: 20000,
        stock: 10,
      },
      {
        name: 'Gift Card',
        description: 'Tarjeta de regalo digital.',
        price: 50000,
        stock: 5,
      },
    ]);

    await this.productsRepository.save(products);
  }
}

