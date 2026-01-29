import { createHash } from 'crypto';
import { Order, OrderItem } from '../../../../../src/application/domain/entities';
import { Money } from '../../../../../src/application/domain/value-objects/money';

describe('Order', () => {
  describe('constructor', () => {
    it('should create order with all properties', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(items, new Money(47.96), new Money(7.98));
      expect(order.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(order.items).toEqual(items);
      expect(order.totalPrice.value).toBe(47.96);
      expect(order.totalVat.value).toBe(7.98);
    });

    it('should create order without body hash', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(items, new Money(47.96), new Money(7.98));
      expect(order.bodyHash).toBeUndefined();
    });

    it('should create order with body hash', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const bodyHash = createHash('sha256')
        .update(JSON.stringify({ items: [{ productId: 'P001', quantity: 2 }] }))
        .digest('hex');
      const order = new Order(items, new Money(47.96), new Money(7.98), bodyHash);
      expect(order.bodyHash).toBe(bodyHash);
    });

    it('should create order with explicit id when loading from persistence', () => {
      const items = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(items, new Money(47.96), new Money(7.98), undefined, 'ord-from-db');
      expect(order.id).toBe('ord-from-db');
    });
  });
});
