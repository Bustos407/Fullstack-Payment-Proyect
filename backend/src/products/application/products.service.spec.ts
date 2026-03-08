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

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todos los productos', async () => {
      repository.find.mockResolvedValue([mockProduct]);
      const result = await service.findAll();
      expect(result).toEqual([mockProduct]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debería retornar el producto si existe', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      const result = await service.findOne(1);
      expect(result).toEqual(mockProduct);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('Producto no encontrado');
    });
  });

  describe('reserveStock', () => {
    it('debería lanzar BadRequestException si units <= 0', async () => {
      await expect(service.reserveStock(1, 0)).rejects.toThrow(BadRequestException);
      await expect(service.reserveStock(1, -1)).rejects.toThrow('Las unidades deben ser mayores que cero');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('debería actualizar el stock y guardar', async () => {
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
    it('no hace nada si ya hay productos', async () => {
      repository.count.mockResolvedValue(1);
      await service.seedIfEmpty();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('crea y guarda productos si la tabla está vacía', async () => {
      repository.count.mockResolvedValue(0);
      const created = [{ id: 1, name: 'Suscripción Premium', description: 'Acceso ilimitado a la plataforma por 1 mes.', price: 20000, stock: 10 }];
      repository.create.mockReturnValue(created as unknown as Product);
      repository.save.mockResolvedValue(created[0] as unknown as Product);
      await service.seedIfEmpty();
      expect(repository.create).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
