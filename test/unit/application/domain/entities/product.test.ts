import { Product } from '../../../../../src/application/domain/entities';

describe('Product', () => {
  describe('constructor', () => {
    it('should create product with all properties', () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      expect(product.id).toBe('P001');
      expect(product.unitPrice).toBe(10.99);
      expect(product.vatRate).toBe(0.22);
      expect(product.availableQuantity).toBe(100);
    });
  });

  describe('hasEnoughStock', () => {
    it('should return true when available quantity is greater than requested', () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      expect(product.hasEnoughStock(50)).toBe(true);
    });

    it('should return true when available quantity equals requested', () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      expect(product.hasEnoughStock(100)).toBe(true);
    });

    it('should return false when available quantity is less than requested', () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      expect(product.hasEnoughStock(101)).toBe(false);
    });
  });
});
