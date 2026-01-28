import { Money } from '../../../../../src/application/domain/value-objects/money';

describe('Money', () => {
  describe('constructor', () => {
    it('should round to 2 decimal places', () => {
      const money = new Money(10.999);
      expect(money.value).toBe(11.0);
    });

    it('should round down to 2 decimal places', () => {
      const money = new Money(10.994);
      expect(money.value).toBe(10.99);
    });

    it('should handle exact 2 decimal places', () => {
      const money = new Money(10.99);
      expect(money.value).toBe(10.99);
    });

    it('should handle integers', () => {
      const money = new Money(10);
      expect(money.value).toBe(10.0);
    });
  });

  describe('add', () => {
    it('should add two money values and round to 2 decimal places', () => {
      const money1 = new Money(10.999);
      const money2 = new Money(5.001);
      const result = money1.add(money2);
      expect(result.value).toBe(16.0);
    });

    it('should return new Money instance', () => {
      const money1 = new Money(10);
      const money2 = new Money(5);
      const result = money1.add(money2);
      expect(result).not.toBe(money1);
      expect(result).not.toBe(money2);
    });
  });

  describe('multiply', () => {
    it('should multiply money by number and round to 2 decimal places', () => {
      const money = new Money(10.999);
      const result = money.multiply(2);
      expect(result.value).toBe(22.0);
    });

    it('should return new Money instance', () => {
      const money = new Money(10);
      const result = money.multiply(2);
      expect(result).not.toBe(money);
    });
  });

  describe('equals', () => {
    it('should return true for equal values', () => {
      const money1 = new Money(10.99);
      const money2 = new Money(10.99);
      expect(money1.equals(money2)).toBe(true);
    });

    it('should return false for different values', () => {
      const money1 = new Money(10.99);
      const money2 = new Money(10.98);
      expect(money1.equals(money2)).toBe(false);
    });
  });
});
