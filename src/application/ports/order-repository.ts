import { Order } from '../domain/entities/order';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(orderId: string): Promise<Order | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<Order | null>;
}
