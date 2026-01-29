import type Database from 'better-sqlite3';
import { ProductRepository } from '../../../../src/infrastructure/repositories/product-repository';

function createMockDb(): Database.Database {
  const prepareMock = jest.fn();
  return { prepare: prepareMock } as unknown as Database.Database;
}

describe('ProductRepository', () => {
  let db: Database.Database;
  let repository: ProductRepository;

  beforeEach(() => {
    db = createMockDb();
    repository = new ProductRepository(db);
  });

  describe('findByIds', () => {
    it('should return empty map when productIds is empty without calling prepare', async () => {
      const result = await repository.findByIds([]);

      expect(result.size).toBe(0);
      expect(db.prepare).not.toHaveBeenCalled();
    });

    it('should call prepare then all with ids when findByIds is called', async () => {
      const allMock = jest.fn().mockReturnValue([]);
      (db.prepare as jest.Mock).mockReturnValue({ all: allMock });

      await repository.findByIds(['P001', 'P002']);

      expect(db.prepare).toHaveBeenCalledTimes(1);
      expect(allMock).toHaveBeenCalledWith('P001', 'P002');
    });

    it('should return map of products when all returns rows', async () => {
      const rows = [{ id: 'P001', unit_price: 10.99, vat_rate: 0.22, available_quantity: 100 }];
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue(rows),
      });

      const result = await repository.findByIds(['P001']);

      expect(result.size).toBe(1);
      const product = result.get('P001');
      expect(product).toBeDefined();
      expect(product!.id).toBe('P001');
      expect(product!.unitPrice).toBe(10.99);
      expect(product!.vatRate).toBe(0.22);
      expect(product!.availableQuantity).toBe(100);
    });

    it('should return empty map when all returns empty array', async () => {
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const result = await repository.findByIds(['P999']);

      expect(result.size).toBe(0);
    });

    it('should return only found products when some ids match', async () => {
      const rows = [{ id: 'P001', unit_price: 10.99, vat_rate: 0.22, available_quantity: 100 }];
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue(rows),
      });

      const result = await repository.findByIds(['P001', 'P999', 'P002']);

      expect(result.size).toBe(1);
      expect(result.get('P001')?.id).toBe('P001');
      expect(result.has('P999')).toBe(false);
      expect(result.has('P002')).toBe(false);
    });

    it('should return multiple products when all returns multiple rows', async () => {
      const rows = [
        { id: 'P001', unit_price: 10.99, vat_rate: 0.22, available_quantity: 100 },
        { id: 'P002', unit_price: 20.99, vat_rate: 0.22, available_quantity: 50 },
      ];
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue(rows),
      });

      const result = await repository.findByIds(['P001', 'P002']);

      expect(result.size).toBe(2);
      expect(result.get('P001')?.unitPrice).toBe(10.99);
      expect(result.get('P002')?.unitPrice).toBe(20.99);
    });

    it('should throw when all throws', async () => {
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockImplementation(() => {
          throw new Error('DB closed');
        }),
      });

      await expect(repository.findByIds(['P001'])).rejects.toThrow('DB closed');
    });
  });
});
