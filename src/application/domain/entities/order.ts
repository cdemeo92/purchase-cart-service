import { Money } from '../value-objects/money';
import { OrderItem } from './order-item';

export class Order {
  constructor(
    public readonly id: string,
    public readonly items: OrderItem[],
    public readonly totalPrice: Money,
    public readonly totalVat: Money,
    public readonly idempotencyKey?: string,
    public readonly bodyHash?: string,
  ) {}
}
