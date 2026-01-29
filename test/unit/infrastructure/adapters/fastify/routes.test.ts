import { registerRoutes } from '../../../../../src/infrastructure/adapters/fastify/routes';
import type { IHttpServer } from '../../../../../src/application/ports';
import type { CreateOrderUseCase } from '../../../../../src/application/use-cases/create-order';
import { mock } from 'jest-mock-extended';

describe('registerRoutes', () => {
  it('should call server.registerRoute once with POST /orders, schema and handler', () => {
    const server = mock<IHttpServer>();
    const createOrderUseCase = mock<CreateOrderUseCase>();

    registerRoutes(server, createOrderUseCase);

    expect(server.registerRoute).toHaveBeenCalledTimes(1);
    const call = (server.registerRoute as jest.Mock).mock.calls[0][0];
    expect(call.method).toBe('POST');
    expect(call.path).toBe('/orders');
    expect(call.schema).toBeDefined();
  });
});
