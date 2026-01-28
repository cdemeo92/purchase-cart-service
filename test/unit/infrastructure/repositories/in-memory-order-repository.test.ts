import { InMemoryOrderRepository } from '../../../../src/infrastructure/repositories';
import { Order } from '../../../../src/application/domain/entities';
import { Money } from '../../../../src/application/domain/value-objects/money';

describe('InMemoryOrderRepository', () => {
  let repository: InMemoryOrderRepository;

  beforeEach(() => {
    repository = new InMemoryOrderRepository();
  });

  describe('save', () => {
    it('should save order', async () => {
      const order = new Order('ord_123', [], new Money(10), new Money(2));

      await repository.save(order);

      const result = await repository.findById('ord_123');
      expect(result).toEqual(order);
    });
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const order = new Order('ord_123', [], new Money(10), new Money(2));
      await repository.save(order);

      const result = await repository.findById('ord_123');

      expect(result).toEqual(order);
    });

    it('should return null when order not found', async () => {
      const result = await repository.findById('ord_999');
      expect(result).toBeNull();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return order when found by idempotency key', async () => {
      const order = new Order('ord_123', [], new Money(10), new Money(2), 'key-123');
      await repository.save(order);

      const result = await repository.findByIdempotencyKey('key-123');

      expect(result).toEqual(order);
    });

    it('should return null when no order with idempotency key', async () => {
      const result = await repository.findByIdempotencyKey('key-999');
      expect(result).toBeNull();
    });

    it('should return null when order has no idempotency key', async () => {
      const order = new Order('ord_123', [], new Money(10), new Money(2));
      await repository.save(order);

      const result = await repository.findByIdempotencyKey('key-123');
      expect(result).toBeNull();
    });
  });
});
