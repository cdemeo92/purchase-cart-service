import type { IProductRepository } from '../../application/ports';
import { Product } from '../../application/domain/entities';

export class InMemoryProductRepository implements IProductRepository {
  constructor(private readonly products: Product[]) {}

  async findByIds(productIds: string[]): Promise<Map<string, Product>> {
    const map = new Map<string, Product>();
    for (const id of productIds) {
      const product = this.products.find((p) => p.id === id);
      if (product) map.set(id, product);
    }
    return Promise.resolve(map);
  }
}
