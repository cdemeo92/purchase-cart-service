import { randomUUID } from 'crypto';
import { Money } from '../value-objects/money';
import { OrderItem } from './order-item';

export class Order {
  public readonly id: string;

  constructor(
    public readonly items: OrderItem[],
    public readonly totalPrice: Money,
    public readonly totalVat: Money,
    public readonly bodyHash?: string,
  ) {
    this.id = randomUUID();
  }
}
