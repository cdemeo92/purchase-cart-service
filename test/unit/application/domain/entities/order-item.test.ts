import { OrderItem } from '../../../../../src/application/domain/entities';
import { Money } from '../../../../../src/application/domain/value-objects/money';

describe('OrderItem', () => {
  describe('constructor', () => {
    it('should create order item with all properties', () => {
      const item = new OrderItem('P001', 2, new Money(39.98), new Money(7.98));
      expect(item.productId).toBe('P001');
      expect(item.quantity).toBe(2);
      expect(item.price.value).toBe(39.98);
      expect(item.vat.value).toBe(7.98);
    });
  });
});
