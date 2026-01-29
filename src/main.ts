import { openDb, runMigrations } from './infrastructure/database/sqlite';
import { ProductRepository, OrderRepository } from './infrastructure/repositories';
import { CreateOrderUseCase } from './application/use-cases/create-order';
import { FastifyHttpServer, registerRoutes } from './infrastructure/adapters/fastify';

async function main(): Promise<void> {
  const db = openDb();
  runMigrations(db);
  const productRepository = new ProductRepository(db);
  const orderRepository = new OrderRepository(db);
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
