export class Product {
  constructor(
    public readonly id: string,
    public readonly unitPrice: number,
    public readonly vatRate: number,
    public readonly availableQuantity: number,
  ) {}

  hasEnoughStock(quantity: number): boolean {
    return this.availableQuantity >= quantity;
  }
}
