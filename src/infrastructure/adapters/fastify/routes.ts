import type { IHttpServer } from '../../../application/ports';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order';
import { createOrderHandler } from './handlers';
import { createOrderSchema } from './swagger-schemas';

export function registerRoutes(server: IHttpServer, createOrderUseCase: CreateOrderUseCase): void {
  server.registerRoute({
    method: 'POST',
    path: '/orders',
    schema: createOrderSchema,
    handler: createOrderHandler(createOrderUseCase),
  });
}
