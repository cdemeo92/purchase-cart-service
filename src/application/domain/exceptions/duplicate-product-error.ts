export class DuplicateProductError extends Error {
  constructor(productId: string) {
    super(`Duplicate product in order: ${productId}`);
    this.name = 'DuplicateProductError';
  }
}
