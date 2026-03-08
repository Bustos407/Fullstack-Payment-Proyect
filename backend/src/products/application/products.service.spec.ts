import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsDynamoRepository } from '../infrastructure/dynamodb/products.dynamodb.repository';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsDynamoRepository>;

  const mockProduct = {
    id: 1,
    name: 'Test',
    description: 'Desc',
    price: '20000.00',
    stock: 10,
  };

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      updateStock: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsDynamoRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsDynamoRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      repository.findAll.mockResolvedValue([mockProduct]);
      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the product if it exists', async () => {
      repository.findById.mockResolvedValue(mockProduct);
      const result = await service.findOne(1);
      expect(result).toEqual(mockProduct);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Product not found');
    });
  });

  describe('reserveStock', () => {
    it('should throw BadRequestException if units <= 0', async () => {
      await expect(service.reserveStock(1, 0)).rejects.toThrow(BadRequestException);
      await expect(service.reserveStock(1, -1)).rejects.toThrow('Units must be greater than zero');
      expect(repository.updateStock).not.toHaveBeenCalled();
    });

    it('should update stock', async () => {
      repository.findById.mockResolvedValue({ ...mockProduct });
      const result = await service.reserveStock(1, 3);
      expect(result.stock).toBe(7);
      expect(repository.updateStock).toHaveBeenCalledWith(1, 7);
    });
  });

  describe('seedIfEmpty', () => {
    it('does nothing if there are already products', async () => {
      repository.count.mockResolvedValue(1);
      await service.seedIfEmpty();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates and saves products if table is empty', async () => {
      repository.count.mockResolvedValue(0);
      await service.seedIfEmpty();
      expect(repository.save).toHaveBeenCalledTimes(2);
    });
  });
});
