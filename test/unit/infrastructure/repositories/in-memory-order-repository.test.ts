import { InMemoryOrderRepository } from '../../../../src/infrastructure/repositories';
import { Order } from '../../../../src/application/domain/entities';
import { Money } from '../../../../src/application/domain/value-objects/money';

describe('InMemoryOrderRepository', () => {
  let repository: InMemoryOrderRepository;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
  });

  describe('save', () => {
    it('should save order and store by idempotency key when provided', async () => {
      const order = new Order([], new Money(10), new Money(2));

      await repository.save(order, 'key-123');

      const result = await repository.findByIdempotencyKey('key-123');
      expect(result).toEqual(order);
    });

    it('should save order without idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));

      await expect(repository.save(order)).resolves.not.toThrow();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return order when found by idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));
      await repository.save(order, 'key-123');

      const result = await repository.findByIdempotencyKey('key-123');

      expect(result).toEqual(order);
    });

    it('should return null when no order with idempotency key', async () => {
      const result = await repository.findByIdempotencyKey('key-999');
      expect(result).toBeNull();
    });

    it('should return null when order saved without idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));
      await repository.save(order);

      const result = await repository.findByIdempotencyKey('key-123');
      expect(result).toBeNull();
    });
  });
});
