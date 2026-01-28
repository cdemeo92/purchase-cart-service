export class InsufficientStockError extends Error {
  constructor(productId: string, requestedQuantity: number, availableQuantity: number) {
    super(
      `Insufficient stock for product ${productId}: requested ${requestedQuantity}, available ${availableQuantity}`,
    );
    this.name = 'InsufficientStockError';
  }
}
