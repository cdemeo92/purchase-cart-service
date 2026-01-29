import { InMemoryProductRepository } from '../../../../src/infrastructure/repositories';
import { Product } from '../../../../src/application/domain/entities';

describe('InMemoryProductRepository', () => {
  let repository: InMemoryProductRepository;

  beforeEach(() => {
    repository = new InMemoryProductRepository([]);
  });

  describe('findByIds', () => {
    it('should return map of products when found', async () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      repository = new InMemoryProductRepository([product]);

      const result = await repository.findByIds(['P001']);

      expect(result.size).toBe(1);
      expect(result.get('P001')).toEqual(product);
    });

    it('should return empty map when no ids match', async () => {
      const result = await repository.findByIds(['P999']);
      expect(result.size).toBe(0);
    });

    it('should return only found products when some ids match', async () => {
      const product1 = new Product('P001', 10.99, 0.22, 100);
      repository = new InMemoryProductRepository([product1]);

      const result = await repository.findByIds(['P001', 'P999', 'P002']);

      expect(result.size).toBe(1);
      expect(result.get('P001')).toEqual(product1);
      expect(result.has('P999')).toBe(false);
      expect(result.has('P002')).toBe(false);
    });

    it('should return all products when multiple ids match', async () => {
      const product1 = new Product('P001', 10.99, 0.22, 100);
      const product2 = new Product('P002', 20.99, 0.22, 50);
      repository = new InMemoryProductRepository([product1, product2]);

      const result = await repository.findByIds(['P001', 'P002']);

      expect(result.size).toBe(2);
      expect(result.get('P001')).toEqual(product1);
      expect(result.get('P002')).toEqual(product2);
    });

    it('should return empty map when given empty array', async () => {
      const product = new Product('P001', 10.99, 0.22, 100);
      repository = new InMemoryProductRepository([product]);

      const result = await repository.findByIds([]);

      expect(result.size).toBe(0);
    });
  });
});
