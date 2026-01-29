import Database from 'better-sqlite3';
import { openDb, runSchema } from '../../../../src/infrastructure/database/sqlite';
import { ProductRepository } from '../../../../src/infrastructure/repositories/product-repository';

describe('ProductRepository', () => {
  let db: InstanceType<typeof Database>;
  let repository: ProductRepository;

  beforeEach(() => {
    db = openDb();
    runSchema(db);
    repository = new ProductRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('findByIds', () => {
    it('should return map of products when found', async () => {
      db.prepare(
        `INSERT INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
      ).run('P001', 10.99, 0.22, 100);

      const result = await repository.findByIds(['P001']);

      expect(result.size).toBe(1);
      const product = result.get('P001');
      expect(product).toBeDefined();
      expect(product!.id).toBe('P001');
      expect(product!.unitPrice).toBe(10.99);
      expect(product!.vatRate).toBe(0.22);
      expect(product!.availableQuantity).toBe(100);
    });

    it('should return empty map when no ids match', async () => {
      const result = await repository.findByIds(['P999']);
      expect(result.size).toBe(0);
    });

    it('should return only found products when some ids match', async () => {
      db.prepare(
        `INSERT INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
      ).run('P001', 10.99, 0.22, 100);

      const result = await repository.findByIds(['P001', 'P999', 'P002']);

      expect(result.size).toBe(1);
      expect(result.get('P001')?.id).toBe('P001');
      expect(result.has('P999')).toBe(false);
      expect(result.has('P002')).toBe(false);
    });

    it('should return all products when multiple ids match', async () => {
      db.prepare(
        `INSERT INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
      ).run('P001', 10.99, 0.22, 100);
      db.prepare(
        `INSERT INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
      ).run('P002', 20.99, 0.22, 50);

      const result = await repository.findByIds(['P001', 'P002']);

      expect(result.size).toBe(2);
      expect(result.get('P001')?.unitPrice).toBe(10.99);
      expect(result.get('P002')?.unitPrice).toBe(20.99);
    });

    it('should return empty map when given empty array', async () => {
      db.prepare(
        `INSERT INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
      ).run('P001', 10.99, 0.22, 100);

      const result = await repository.findByIds([]);

      expect(result.size).toBe(0);
    });

    it('should throw when database is closed', async () => {
      const closedDb = openDb();
      runSchema(closedDb);
      const closedRepo = new ProductRepository(closedDb);
      closedDb.close();

      await expect(
        Promise.resolve().then(() => closedRepo.findByIds(['P001'])),
      ).rejects.toBeDefined();
    });
  });
});
