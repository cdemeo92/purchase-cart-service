import Database from 'better-sqlite3';
import type { IOrderRepository } from '../../application/ports';
import { Order, OrderItem } from '../../application/domain/entities';
import { Money } from '../../application/domain/value-objects/money';

export class OrderRepository implements IOrderRepository {
  constructor(private readonly db: Database.Database) {}

  public async save(order: Order, idempotencyKey?: string): Promise<void> {
    const insertOrder = this.db.prepare(
      `INSERT INTO orders (id, total_price, total_vat, body_hash, idempotency_key) VALUES (?, ?, ?, ?, ?)`,
    );
    const insertItem = this.db.prepare(
      `INSERT INTO order_items (order_id, position, product_id, quantity, price_value, vat_value) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const saveOrder = this.db.transaction(() => {
      insertOrder.run(
        order.id,
        order.totalPrice.value,
        order.totalVat.value,
        order.bodyHash ?? null,
        idempotencyKey ?? null,
      );
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i]!;
        insertItem.run(
          order.id,
          i,
          item.productId,
          item.quantity,
          item.price.value,
          item.vat.value,
        );
      }
    });
    saveOrder();
    return Promise.resolve();
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    const rows = this.db
      .prepare(
        `SELECT o.id, o.total_price, o.total_vat, o.body_hash,
                oi.product_id, oi.quantity, oi.price_value, oi.vat_value
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.idempotency_key = ?
        ORDER BY oi.position`,
      )
      .all(idempotencyKey) as Array<{
      id: string;
      total_price: number;
      total_vat: number;
      body_hash: string | null;
      product_id: string | null;
      quantity: number | null;
      price_value: number | null;
      vat_value: number | null;
    }>;
    if (rows.length === 0) return Promise.resolve(null);

    const first = rows[0]!;
    const items = rows
      .filter((r) => r.product_id != null)
      .map(
        (r) =>
          new OrderItem(
            r.product_id!,
            r.quantity!,
            new Money(r.price_value!),
            new Money(r.vat_value!),
          ),
      );
    return Promise.resolve(
      new Order(
        items,
        new Money(first.total_price),
        new Money(first.total_vat),
        first.body_hash ?? undefined,
        first.id,
      ),
    );
  }
}
