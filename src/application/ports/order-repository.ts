import { Order } from '../domain/entities/order';

export interface IOrderRepository {
  save(order: Order, idempotencyKey?: string): Promise<void>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
}
