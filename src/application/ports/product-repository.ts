import { Product } from '../domain/entities/product';

export interface IProductRepository {
  findById(productId: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
}
