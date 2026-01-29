import Database from 'better-sqlite3';
import { openDb, runMigrations } from '../../src/infrastructure/database/sqlite';
import { ProductRepository } from '../../src/infrastructure/repositories/product-repository';

describe('ProductRepository (integration)', () => {
  let db: InstanceType<typeof Database>;
  let repository: ProductRepository;

  beforeEach(() => {
    db = openDb();
    runMigrations(db);
    repository = new ProductRepository(db);
  });

  afterEach(() => {
    if (db) db.close();
  });

  describe('findByIds', () => {
    it('should return map of products when found', async () => {
      const result = await repository.findByIds(['P001']);

      expect(result.size).toBe(1);
      const product = result.get('P001');
      expect(product).toBeDefined();
      expect(product!.id).toBe('P001');
      expect(product!.unitPrice).toBe(20);
      expect(product!.vatRate).toBe(0.22);
      expect(product!.availableQuantity).toBe(100);
    });

    it('should return empty map when no ids match', async () => {
      const result = await repository.findByIds(['P999']);
      expect(result.size).toBe(0);
    });

    it('should return only found products when some ids match', async () => {
      const result = await repository.findByIds(['P001', 'P999', 'P002']);

      expect(result.size).toBe(2);
      expect(result.get('P001')?.id).toBe('P001');
      expect(result.has('P999')).toBe(false);
      expect(result.get('P002')?.id).toBe('P002');
    });

    it('should return all products when multiple ids match', async () => {
      const result = await repository.findByIds(['P001', 'P002']);

      expect(result.size).toBe(2);
      expect(result.get('P001')?.unitPrice).toBe(20);
      expect(result.get('P002')?.unitPrice).toBe(10);
    });

    it('should return empty map when given empty array', async () => {
      const result = await repository.findByIds([]);

      expect(result.size).toBe(0);
    });

    it('should throw when database is closed', async () => {
      const closedDb = openDb();
      runMigrations(closedDb);
      const closedRepo = new ProductRepository(closedDb);
      closedDb.close();

      await expect(
        Promise.resolve().then(() => closedRepo.findByIds(['P001'])),
      ).rejects.toBeDefined();
    });
  });
});
