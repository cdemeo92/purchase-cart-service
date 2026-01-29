import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  CreateOrderUseCase,
  CreateOrderRequest,
} from '../../../application/use-cases/create-order';
import {
  ProductNotFoundError,
  InsufficientStockError,
  IdempotencyConflictError,
} from '../../../application/domain/exceptions';

export function createOrderHandler(useCase: CreateOrderUseCase) {
  return async (req, reply): Promise<void> => {
    const request = req as FastifyRequest;
    const body = request.body as CreateOrderRequest;
    const idempotencyKey = request.headers['idempotency-key'] as string | undefined;

    try {
      const result = await useCase.execute(body, idempotencyKey);
      await (reply as FastifyReply).code(201).send(result);
    } catch (error) {
      if (error instanceof ProductNotFoundError || error instanceof InsufficientStockError) {
        console.error(`error | POST ${request.url} | 422 | ${error.message}`);
        await (reply as FastifyReply).code(422).send({ error: error.message });
        return;
      }
      if (error instanceof IdempotencyConflictError) {
        console.error(`error | POST ${request.url} | 409 | ${error.message}`);
        await (reply as FastifyReply).code(409).send({ error: error.message });
        return;
      }
      await (reply as FastifyReply).code(500).send({ error: 'Internal server error' });
    }
  };
}
