import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { Payment } from '../infrastructure/typeorm/payment.entity';
import { PaymentStatus } from '../domain/payment-status.enum';
import { ProductsService } from '../../products/application/products.service';
import { CreatePaymentWompiDto } from './dto/create-payment-wompi.dto';
import { WompiClient } from '../infrastructure/wompi/wompi.client';

  describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepository: jest.Mocked<Repository<Payment>>;
  let productsService: jest.Mocked<ProductsService>;

  const mockProduct = {
    id: 1,
    name: 'Test',
    price: 20000,
    stock: 10,
  };

  const validWompiDto: CreatePaymentWompiDto = {
    productId: 1,
    units: 2,
    cardToken: 'tok_xxx',
    acceptanceToken: 'accept_xxx',
    acceptPersonalAuth: 'auth_xxx',
    customerName: 'Test',
    customerEmail: 'test@example.com',
    deliveryAddress: 'Calle 123',
  };

  beforeEach(async () => {
    const mockPaymentsRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const mockProductsService = {
      reserveStock: jest.fn(),
      findOne: jest.fn(),
    };

    const mockWompiClient = {
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      isFinalStatus: jest.fn((s: string) => ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(s)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentsRepo,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: WompiClient,
          useValue: mockWompiClient,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentsRepository = module.get(getRepositoryToken(Payment));
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return the payment if it exists', async () => {
      const payment = { id: 'uuid-1', status: PaymentStatus.APPROVED };
      paymentsRepository.findOne.mockResolvedValue(payment as never);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(payment);
      expect(paymentsRepository.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    });

    it('should return null if it does not exist', async () => {
      paymentsRepository.findOne.mockResolvedValue(null);
      const result = await service.findOne('no-existe');
      expect(result).toBeNull();
    });
  });

  describe('createPaymentWithWompi', () => {
    const mockWompiClient = {
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      isFinalStatus: jest.fn((s: string) => ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(s)),
    };

    beforeEach(async () => {
      const mockPaymentsRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };
      const mockProductsService = {
        reserveStock: jest.fn(),
        findOne: jest.fn().mockResolvedValue({ ...mockProduct, price: 20000 }),
      };
      const moduleWithWompi = await Test.createTestingModule({
        providers: [
          PaymentsService,
          { provide: getRepositoryToken(Payment), useValue: mockPaymentsRepo },
          { provide: ProductsService, useValue: mockProductsService },
          { provide: WompiClient, useValue: mockWompiClient },
        ],
      }).compile();
      service = moduleWithWompi.get<PaymentsService>(PaymentsService);
      paymentsRepository = moduleWithWompi.get(getRepositoryToken(Payment));
      productsService = moduleWithWompi.get(ProductsService);
      jest.clearAllMocks();
    });

    it('creates payment in PENDING, calls Wompi, updates to APPROVED and reserves stock', async () => {
      const savedPayment = {
        id: 'pay-uuid',
        product: mockProduct,
        units: 2,
        totalAmount: 47000,
        status: PaymentStatus.PENDING,
        customerName: validWompiDto.customerName,
        customerEmail: validWompiDto.customerEmail,
        deliveryAddress: validWompiDto.deliveryAddress,
      };
      paymentsRepository.create.mockReturnValue(savedPayment as never);
      paymentsRepository.save.mockResolvedValue(savedPayment as never);
      paymentsRepository.findOne.mockResolvedValue({ ...savedPayment, status: PaymentStatus.APPROVED } as never);
      mockWompiClient.createTransaction.mockResolvedValue({ data: { id: 'wompi-tx-1' } });
      mockWompiClient.getTransaction.mockResolvedValue({ data: { status: 'APPROVED' } });
      productsService.reserveStock.mockResolvedValue(mockProduct as never);

      const result = await service.createPaymentWithWompi(validWompiDto);

      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(mockWompiClient.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          reference: 'pay-uuid',
          amountInCents: 4700000,
          cardToken: 'tok_xxx',
          acceptanceToken: 'accept_xxx',
        }),
      );
      expect(productsService.reserveStock).toHaveBeenCalledWith(1, 2);
    });

    it('actualiza a REJECTED cuando Wompi no devuelve id', async () => {
      const savedPayment = {
        id: 'pay-uuid',
        product: mockProduct,
        units: 2,
        totalAmount: 47000,
        status: PaymentStatus.PENDING,
        customerName: validWompiDto.customerName,
        customerEmail: validWompiDto.customerEmail,
        deliveryAddress: validWompiDto.deliveryAddress,
      };
      paymentsRepository.create.mockReturnValue(savedPayment as never);
      paymentsRepository.save.mockResolvedValue(savedPayment as never);
      paymentsRepository.findOne.mockResolvedValue({ ...savedPayment, status: PaymentStatus.REJECTED } as never);
      mockWompiClient.createTransaction.mockResolvedValue({ data: {} });

      const result = await service.createPaymentWithWompi(validWompiDto);

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(paymentsRepository.update).toHaveBeenCalledWith('pay-uuid', { status: PaymentStatus.REJECTED });
    });
  });
});
