import { Money } from '../value-objects/money';

export class OrderItem {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: Money,
    public readonly vat: Money,
  ) {}
}
