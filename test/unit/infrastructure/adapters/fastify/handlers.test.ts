import { createOrderHandler } from '../../../../../src/infrastructure/adapters/fastify/handlers';
import type { CreateOrderUseCase } from '../../../../../src/application/use-cases/create-order';
import {
  ProductNotFoundError,
  InsufficientStockError,
  DuplicateProductError,
  IdempotencyConflictError,
} from '../../../../../src/application/domain/exceptions';
import { mock } from 'jest-mock-extended';

describe('createOrderHandler', () => {
  const useCase = mock<CreateOrderUseCase>();
  const handler = createOrderHandler(useCase);

  const createReply = () => {
    const send = jest.fn();
    const code = jest.fn().mockReturnValue({ send });
    return { code, send };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call useCase.execute with body and undefined idempotencyKey and send 201 with result', async () => {
    const body = { items: [{ productId: 'P001', quantity: 2 }] };
    const req = { body, headers: {} };
    const reply = createReply();
    const result = {
      orderId: 'ord-1',
      totalPrice: 48.8,
      totalVat: 8.8,
      items: [{ productId: 'P001', quantity: 2, price: 40, vat: 8.8 }],
    };
    useCase.execute.mockResolvedValue(result);

    await handler(req, reply);

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(body, undefined);
    expect(reply.code).toHaveBeenCalledWith(201);
    expect(reply.send).toHaveBeenCalledWith(result);
  });

  it('should pass idempotency-key header to useCase.execute', async () => {
    const body = { items: [{ productId: 'P001', quantity: 1 }] };
    const req = {
      body,
      headers: { 'idempotency-key': 'key-123' } as Record<string, string>,
    };
    const reply = createReply();
    useCase.execute.mockResolvedValue({
      orderId: 'ord-1',
      totalPrice: 20,
      totalVat: 4.4,
      items: [{ productId: 'P001', quantity: 1, price: 20, vat: 4.4 }],
    });

    await handler(req, reply);

    expect(useCase.execute).toHaveBeenCalledWith(body, 'key-123');
  });

  it('should send 422 with error message on ProductNotFoundError', async () => {
    const req = {
      body: { items: [{ productId: 'P999', quantity: 1 }] },
      headers: {},
    };
    const reply = createReply();
    useCase.execute.mockRejectedValue(new ProductNotFoundError('P999'));

    await handler(req, reply);

    expect(reply.code).toHaveBeenCalledWith(422);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Product not found: P999',
    });
  });

  it('should send 422 with error message on InsufficientStockError', async () => {
    const req = {
      body: { items: [{ productId: 'P001', quantity: 200 }] },
      headers: {},
    };
    const reply = createReply();
    useCase.execute.mockRejectedValue(new InsufficientStockError('P001', 200, 100));

    await handler(req, reply);

    expect(reply.code).toHaveBeenCalledWith(422);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Insufficient stock for product P001: requested 200, available 100',
    });
  });

  it('should send 422 with error message on DuplicateProductError', async () => {
    const req = {
      body: {
        items: [
          { productId: 'P001', quantity: 1 },
          { productId: 'P001', quantity: 2 },
        ],
      },
      headers: {},
    };
    const reply = createReply();
    useCase.execute.mockRejectedValue(new DuplicateProductError('P001'));

    await handler(req, reply);

    expect(reply.code).toHaveBeenCalledWith(422);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Duplicate product in order: P001',
    });
  });

  it('should send 409 with error message on IdempotencyConflictError', async () => {
    const req = {
      body: { items: [{ productId: 'P001', quantity: 2 }] },
      headers: { 'idempotency-key': 'key-456' } as Record<string, string>,
    };
    const reply = createReply();
    useCase.execute.mockRejectedValue(new IdempotencyConflictError('key-456'));

    await handler(req, reply);

    expect(reply.code).toHaveBeenCalledWith(409);
    expect(reply.send).toHaveBeenCalledWith({
      error:
        'Idempotency key conflict: key-456. An order was already created with a different body.',
    });
  });

  it('should send 500 with internal server error on generic error', async () => {
    const req = {
      body: { items: [{ productId: 'P001', quantity: 1 }] },
      headers: {},
    };
    const reply = createReply();
    useCase.execute.mockRejectedValue(new Error('Unexpected'));

    await handler(req, reply);

    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });
});
