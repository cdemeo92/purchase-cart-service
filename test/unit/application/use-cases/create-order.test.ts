import { createHash } from 'crypto';
import { CreateOrderUseCase } from '../../../../src/application/use-cases/create-order';
import type { IProductRepository, IOrderRepository } from '../../../../src/application/ports';
import { Product, Order } from '../../../../src/application/domain/entities';
import { Money } from '../../../../src/application/domain/value-objects/money';
import {
  ProductNotFoundError,
  InsufficientStockError,
  IdempotencyConflictError,
} from '../../../../src/application/domain/exceptions';
import { mock, MockProxy } from 'jest-mock-extended';

describe('CreateOrderUseCase', () => {
  let productRepository: MockProxy<IProductRepository>;
  let orderRepository: MockProxy<IOrderRepository>;
  let useCase: CreateOrderUseCase;
  let product1: Product;
  let product2: Product;

  beforeEach(() => {
    productRepository = mock<IProductRepository>();
    orderRepository = mock<IOrderRepository>();
    useCase = new CreateOrderUseCase(productRepository, orderRepository);

    product1 = new Product('P001', 20.0, 0.22, 100);
    product2 = new Product('P002', 10.0, 0.22, 50);
  });

  describe('execute', () => {
    it('should create order successfully without idempotency key', async () => {
      productRepository.findByIds.mockResolvedValue(new Map([['P001', product1]]));
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      orderRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        items: [{ productId: 'P001', quantity: 2 }],
      });

      expect(result.orderId).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('P001');
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].price).toBe(40);
      expect(result.items[0].vat).toBe(8.8);
      expect(result.totalPrice).toBe(48.8);
      expect(result.totalVat).toBe(8.8);
      expect(orderRepository.save).toHaveBeenCalledTimes(1);
      expect(productRepository.findByIds).toHaveBeenCalledWith(['P001']);
    });

    it('should create order with multiple items', async () => {
      productRepository.findByIds.mockResolvedValue(
        new Map([
          ['P001', product1],
          ['P002', product2],
        ]),
      );
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      orderRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        items: [
          { productId: 'P001', quantity: 2 },
          { productId: 'P002', quantity: 1 },
        ],
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalPrice).toBe(61.0);
      expect(result.totalVat).toBe(11.0);
      expect(productRepository.findByIds).toHaveBeenCalledWith(['P001', 'P002']);
    });

    it('should create order and save with idempotency key when key is new', async () => {
      productRepository.findByIds.mockResolvedValue(new Map([['P001', product1]]));
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      orderRepository.save.mockResolvedValue();

      const result = await useCase.execute(
        { items: [{ productId: 'P001', quantity: 2 }] },
        'key-new',
      );

      expect(result.orderId).toBeDefined();
      expect(result.totalPrice).toBe(48.8);
      expect(orderRepository.save).toHaveBeenCalledTimes(1);
      expect(orderRepository.save).toHaveBeenCalledWith(expect.any(Order), 'key-new');
    });

    it('should return existing order when idempotency key matches', async () => {
      const request = { items: [{ productId: 'P001', quantity: 2 }] };
      const bodyHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
      const existingOrder = new Order([], new Money(48.8), new Money(8.8), bodyHash);
      orderRepository.findByIdempotencyKey.mockResolvedValue(existingOrder);

      const result = await useCase.execute(request, 'key-123');

      expect(result.orderId).toBe(existingOrder.id);
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should return existing order when idempotency key matches and order has no bodyHash', async () => {
      const existingOrder = new Order([], new Money(48.8), new Money(8.8));
      orderRepository.findByIdempotencyKey.mockResolvedValue(existingOrder);

      const result = await useCase.execute(
        { items: [{ productId: 'P001', quantity: 2 }] },
        'key-123',
      );

      expect(result.orderId).toBe(existingOrder.id);
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should throw IdempotencyConflictError when key exists with different body', async () => {
      const existingRequest = { items: [{ productId: 'P001', quantity: 1 }] };
      const existingBodyHash = createHash('sha256')
        .update(JSON.stringify(existingRequest))
        .digest('hex');
      const existingOrder = new Order([], new Money(48.8), new Money(8.8), existingBodyHash);
      orderRepository.findByIdempotencyKey.mockResolvedValue(existingOrder);

      await expect(
        useCase.execute(
          {
            items: [{ productId: 'P001', quantity: 2 }],
          },
          'key-123',
        ),
      ).rejects.toThrow(IdempotencyConflictError);
    });

    it('should throw ProductNotFoundError when product does not exist', async () => {
      productRepository.findByIds.mockResolvedValue(new Map());
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);

      await expect(
        useCase.execute({
          items: [{ productId: 'P999', quantity: 1 }],
        }),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw InsufficientStockError when quantity exceeds available stock', async () => {
      productRepository.findByIds.mockResolvedValue(new Map([['P001', product1]]));
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);

      await expect(
        useCase.execute({
          items: [{ productId: 'P001', quantity: 101 }],
        }),
      ).rejects.toThrow(InsufficientStockError);
    });

    it('should sum quantities when same product appears multiple times', async () => {
      productRepository.findByIds.mockResolvedValue(new Map([['P001', product1]]));
      orderRepository.findByIdempotencyKey.mockResolvedValue(null);
      orderRepository.save.mockResolvedValue();

      const result = await useCase.execute({
        items: [
          { productId: 'P001', quantity: 1 },
          { productId: 'P001', quantity: 2 },
        ],
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('P001');
      expect(result.items[0].quantity).toBe(3);
      expect(result.items[0].price).toBe(60);
      expect(result.items[0].vat).toBe(13.2);
      expect(result.totalPrice).toBe(73.2);
      expect(result.totalVat).toBe(13.2);
    });
  });
});
