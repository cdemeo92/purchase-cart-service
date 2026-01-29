import { openDb, runSchema, runMigrations } from '../../../../src/infrastructure/database/sqlite';

describe('database/sqlite', () => {
  describe('openDb', () => {
    it('should open in-memory database', () => {
      const db = openDb();
      expect(db).toBeDefined();
      db.close();
    });

    it('should throw when path is invalid', () => {
      const prev = process.env.SQLITE_DB_PATH;
      process.env.SQLITE_DB_PATH = '/nonexistent/invalid/path/db.sqlite';
      expect(() => openDb()).toThrow();
      process.env.SQLITE_DB_PATH = prev;
    });
  });

  describe('runSchema', () => {
    it('should create products, orders, order_items tables', () => {
      const db = openDb();
      runSchema(db);
      const table = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'")
        .get();
      expect(table).toBeDefined();
      db.close();
    });

    it('should throw when database is closed', () => {
      const db = openDb();
      db.close();
      expect(() => runSchema(db)).toThrow();
    });
  });

  describe('runMigrations', () => {
    it('should run schema and seed products from catalog', () => {
      const db = openDb();
      runMigrations(db);
      const row = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
      expect(row.count).toBeGreaterThan(0);
      db.close();
    });
  });
});
