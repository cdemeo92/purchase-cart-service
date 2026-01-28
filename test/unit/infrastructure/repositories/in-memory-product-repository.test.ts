import { InMemoryProductRepository } from '../../../../src/infrastructure/repositories';
import { Product } from '../../../../src/application/domain/entities';

describe('InMemoryProductRepository', () => {
  let repository: InMemoryProductRepository;

  beforeEach(() => {
    repository = new InMemoryProductRepository([]);
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      repository = new InMemoryProductRepository([product]);

      const result = await repository.findById('P001');

      expect(result).toEqual(product);
    });

    it('should return null when product not found', async () => {
      const result = await repository.findById('P999');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const product1 = new Product('P001', 10.99, 0.22, 100);
      const product2 = new Product('P002', 20.99, 0.22, 50);
      repository = new InMemoryProductRepository([product1, product2]);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(product1);
      expect(result).toContainEqual(product2);
    });

    it('should return empty array when no products', async () => {
      const result = await repository.findAll();
      expect(result).toEqual([]);
    });
  });
});
