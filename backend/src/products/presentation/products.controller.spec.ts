import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from '../application/products.service';
import { Product } from '../infrastructure/typeorm/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Desc 1',
      price: 10000,
      stock: 5,
    } as Product,
  ];

  beforeEach(async () => {
    const mockProductsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('findAll retorna los productos del servicio', async () => {
    service.findAll.mockResolvedValue(mockProducts);
    const result = await controller.findAll();
    expect(result).toEqual(mockProducts);
    expect(service.findAll).toHaveBeenCalled();
  });
});
