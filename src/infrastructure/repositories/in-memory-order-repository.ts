import type { IOrderRepository } from '../../application/ports';
import { Order } from '../../application/domain/entities';

export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders: Map<string, Order> = new Map();
  private readonly idempotencyIndex: Map<string, Order> = new Map();

  public async save(order: Order, idempotencyKey?: string): Promise<void> {
    this.orders.set(order.id, order);
    if (idempotencyKey) {
      this.idempotencyIndex.set(idempotencyKey, order);
    }
    return Promise.resolve();
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<Order | null> {
    return Promise.resolve(this.idempotencyIndex.get(idempotencyKey) || null);
  }
}
