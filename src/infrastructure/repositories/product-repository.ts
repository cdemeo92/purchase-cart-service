import Database from 'better-sqlite3';
import type { IProductRepository } from '../../application/ports';
import { Product } from '../../application/domain/entities';

export class ProductRepository implements IProductRepository {
  constructor(private readonly db: Database.Database) {}

  public async findByIds(productIds: string[]): Promise<Map<string, Product>> {
    if (productIds.length === 0) return Promise.resolve(new Map());
    const placeholders = productIds.map(() => '?').join(', ');
    const rows = this.db
      .prepare(
        `SELECT id, unit_price, vat_rate, available_quantity FROM products WHERE id IN (${placeholders})`,
      )
      .all(...productIds) as Array<{
      id: string;
      unit_price: number;
      vat_rate: number;
      available_quantity: number;
    }>;
    return Promise.resolve(
      new Map(
        rows.map((row) => [
          row.id,
          new Product(row.id, row.unit_price, row.vat_rate, row.available_quantity),
        ]),
      ),
    );
  }
}
