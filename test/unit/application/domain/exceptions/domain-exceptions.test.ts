import {
  ProductNotFoundError,
  InsufficientStockError,
  IdempotencyConflictError,
} from '../../../../../src/application/domain/exceptions';

describe('Domain Exceptions', () => {
  describe('ProductNotFoundError', () => {
    it('should create error with product id', () => {
      const error = new ProductNotFoundError('P999');
      expect(error.message).toContain('P999');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InsufficientStockError', () => {
    it('should create error with product id and requested quantity', () => {
      const error = new InsufficientStockError('P001', 100, 50);
      expect(error.message).toContain('P001');
      expect(error.message).toContain('100');
      expect(error.message).toContain('50');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('IdempotencyConflictError', () => {
    it('should create error with idempotency key', () => {
      const error = new IdempotencyConflictError('key-123');
      expect(error.message).toContain('key-123');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
