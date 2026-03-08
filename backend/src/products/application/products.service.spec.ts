import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../infrastructure/typeorm/product.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test',
    description: 'Desc',
    price: 20000,
    stock: 10,
  } as Product;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      repository.find.mockResolvedValue([mockProduct]);
      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the product if it exists', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const result = await service.findOne(1);
      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException if product does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Product not found');
    });
  });

  describe('reserveStock', () => {
    it('should throw BadRequestException if units <= 0', async () => {
      await expect(service.reserveStock(1, 0)).rejects.toThrow(BadRequestException);
      await expect(service.reserveStock(1, -1)).rejects.toThrow('Units must be greater than zero');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update stock and save', async () => {
      repository.findOne.mockResolvedValue({ ...mockProduct });
      repository.save.mockImplementation((entity) => Promise.resolve({ ...entity } as Product));
      const result = await service.reserveStock(1, 3);
      expect(result.stock).toBe(7);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          stock: 7,
        }),
      );
    });
  });

  describe('seedIfEmpty', () => {
    it('does nothing if there are already products', async () => {
      repository.count.mockResolvedValue(1);
      await service.seedIfEmpty();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates and saves products if table is empty', async () => {
      repository.count.mockResolvedValue(0);
      const created = [
        {
          id: 1,
          name: 'Premium subscription',
          description: 'Unlimited access to the platform for 1 month.',
          price: 20000,
          stock: 10,
        },
      ];
      repository.create.mockReturnValue(created as unknown as Product);
      repository.save.mockResolvedValue(created[0] as unknown as Product);
      await service.seedIfEmpty();
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
