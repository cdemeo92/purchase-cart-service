import { readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';

interface ProductData {
  id: string;
  unitPrice: number;
  vatRate: number;
  availableQuantity: number;
}

export function openDb(): Database.Database {
  const path = process.env.SQLITE_DB_PATH || ':memory:';
  return new Database(path);
}

export function runSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      unit_price REAL NOT NULL,
      vat_rate REAL NOT NULL,
      available_quantity INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      total_price REAL NOT NULL,
      total_vat REAL NOT NULL,
      body_hash TEXT,
      idempotency_key TEXT UNIQUE
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_value REAL NOT NULL,
      vat_value REAL NOT NULL,
      PRIMARY KEY (order_id, position),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);
}

export function runMigrations(db: Database.Database): void {
  runSchema(db);
  const catalogPath =
    process.env.PRODUCTS_CATALOG_PATH || join(process.cwd(), 'products', 'catalog.json');
  const productsData: ProductData[] = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  const insert = db.prepare(
    `INSERT OR REPLACE INTO products (id, unit_price, vat_rate, available_quantity) VALUES (?, ?, ?, ?)`,
  );
  for (const p of productsData) {
    insert.run(p.id, p.unitPrice, p.vatRate, p.availableQuantity);
  }
}
