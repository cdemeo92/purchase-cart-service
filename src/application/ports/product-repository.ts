import { Product } from '../domain/entities/product';

export interface IProductRepository {
  findByIds(productIds: string[]): Promise<Map<string, Product>>;
}
