import type { IProductRepository } from '../../application/ports';
import { Product } from '../../application/domain/entities';

export class InMemoryProductRepository implements IProductRepository {
  constructor(private readonly products: Product[]) {}

  async findById(productId: string): Promise<Product | null> {
    return Promise.resolve(this.products.find((p) => p.id === productId) || null);
  }

  async findAll(): Promise<Product[]> {
    return Promise.resolve([...this.products]);
  }
}
