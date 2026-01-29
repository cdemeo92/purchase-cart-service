import { readFileSync } from 'fs';
import { join } from 'path';
import { Product } from './application/domain/entities';
import { InMemoryProductRepository, InMemoryOrderRepository } from './infrastructure/repositories';
import { CreateOrderUseCase } from './application/use-cases/create-order';
import { FastifyHttpServer, registerRoutes } from './infrastructure/adapters/fastify';

interface ProductData {
  id: string;
  unitPrice: number;
  vatRate: number;
  availableQuantity: number;
}

function loadProducts(): Product[] {
  const catalogPath =
    process.env.PRODUCTS_CATALOG_PATH || join(__dirname, '..', 'products', 'catalog.json');
  const productsData: ProductData[] = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  return productsData.map(
    (data) => new Product(data.id, data.unitPrice, data.vatRate, data.availableQuantity),
  );
}

async function main(): Promise<void> {
  const productRepository = new InMemoryProductRepository(loadProducts());
  const orderRepository = new InMemoryOrderRepository();
  const createOrderUseCase = new CreateOrderUseCase(productRepository, orderRepository);
  const httpServer = new FastifyHttpServer();

  await httpServer.initializeSwagger();
  registerRoutes(httpServer, createOrderUseCase);

  const port = parseInt(process.env.PORT || '3000', 10);
  await httpServer.start(port);
  console.log(`Purchase Cart Service started on port ${port}`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
