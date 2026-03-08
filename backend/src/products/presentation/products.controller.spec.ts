import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService, ProductResponse } from '../application/products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockProducts: ProductResponse[] = [
    {
      id: 1,
      name: 'Product 1',
      description: 'Desc 1',
      price: '10000.00',
      stock: 5,
    },
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

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll returns the products from the service', async () => {
    service.findAll.mockResolvedValue(mockProducts);
    const result = await controller.findAll();
    expect(result).toEqual(mockProducts);
    expect(service.findAll).toHaveBeenCalled();
  });
});
