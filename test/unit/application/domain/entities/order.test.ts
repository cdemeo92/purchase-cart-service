import { Order, OrderItem } from '../../../../../src/application/domain/entities';
import { Money } from '../../../../../src/application/domain/value-objects/money';

describe('Order', () => {
  describe('constructor', () => {
    it('should create order with all properties', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order('ord_123', items, new Money(47.96), new Money(7.98));
      expect(order.id).toBe('ord_123');
      expect(order.items).toEqual(items);
      expect(order.totalPrice.value).toBe(47.96);
      expect(order.totalVat.value).toBe(7.98);
    });

    it('should create order without idempotency key', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order('ord_123', items, new Money(47.96), new Money(7.98));
      expect(order.idempotencyKey).toBeUndefined();
    });

    it('should create order with idempotency key and body hash', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(
        'ord_123',
        items,
        new Money(47.96),
        new Money(7.98),
        'key-123',
        'hash123',
      );
      expect(order.idempotencyKey).toBe('key-123');
      expect(order.bodyHash).toBe('hash123');
    });
  });
});
