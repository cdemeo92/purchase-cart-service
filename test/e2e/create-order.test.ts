import Database from 'better-sqlite3';
import { openDb, runMigrations } from '../../src/infrastructure/database/sqlite';
import { ProductRepository } from '../../src/infrastructure/repositories/product-repository';
import { OrderRepository } from '../../src/infrastructure/repositories/order-repository';
import { CreateOrderUseCase } from '../../src/application/use-cases/create-order';
import { FastifyHttpServer, registerRoutes } from '../../src/infrastructure/adapters/fastify';

describe('E2E: Create Order', () => {
  let server: FastifyHttpServer;
  let baseUrl: string;
  let db: InstanceType<typeof Database>;

  beforeAll(async () => {
    db = openDb();
    runMigrations(db);
    const productRepository = new ProductRepository(db);
    const orderRepository = new OrderRepository(db);
    const createOrderUseCase = new CreateOrderUseCase(productRepository, orderRepository);
    server = new FastifyHttpServer();
    await server.initializeSwagger();
    registerRoutes(server, createOrderUseCase);
    await server.start(0);
    const app = (
      server as unknown as { app: { server: { address: () => { port: number } | null } } }
    ).app;
    const address = app.server.address();
    const port = address && typeof address === 'object' ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    await (server as unknown as { app: { close: () => Promise<void> } }).app.close();
    db.close();
  });

  describe('POST /orders', () => {
    it('should create order successfully without idempotency key', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'P001', quantity: 2 },
            { productId: 'P002', quantity: 1 },
          ],
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.orderId).toBeDefined();
      expect(data.items).toHaveLength(2);
      expect(data.totalPrice).toBe(61.0);
      expect(data.totalVat).toBe(11.0);
    });

    it('should return same order when idempotency key is reused with same body', async () => {
      const idempotencyKey = 'test-key-123';
      const body = {
        items: [{ productId: 'P001', quantity: 1 }],
      };

      const response1 = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      expect(response1.status).toBe(201);
      const data1 = await response1.json();
      const orderId1 = data1.orderId;

      const response2 = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      expect(response2.status).toBe(201);
      const data2 = await response2.json();
      expect(data2.orderId).toBe(orderId1);
    });

    it('should return 409 when idempotency key is reused with different body', async () => {
      const idempotencyKey = 'test-key-456';

      await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          items: [{ productId: 'P001', quantity: 1 }],
        }),
      });

      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          items: [{ productId: 'P001', quantity: 2 }],
        }),
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('Idempotency key conflict');
    });

    it('should return 422 when product does not exist', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'P999', quantity: 1 }],
        }),
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toContain('Product not found');
    });

    it('should return 422 when quantity exceeds available stock', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'P001', quantity: 101 }],
        }),
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toContain('Insufficient stock');
    });

    it('should sum quantities when same product appears multiple times', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'P001', quantity: 1 },
            { productId: 'P001', quantity: 2 },
          ],
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].productId).toBe('P001');
      expect(data.items[0].quantity).toBe(3);
      expect(data.items[0].price).toBe(60.0);
      expect(data.items[0].vat).toBe(13.2);
      expect(data.totalPrice).toBe(73.2);
      expect(data.totalVat).toBe(13.2);
    });

    it('should return 400 when items array is empty', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(typeof data.error).toBe('string');
    });

    it('should return 400 when quantity is missing', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'P001' }],
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when body is missing items', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when productId is empty string', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: '', quantity: 1 }],
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 when quantity is zero', async () => {
      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ productId: 'P001', quantity: 0 }],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /docs', () => {
    it('should return 200 and serve Swagger UI', async () => {
      const response = await fetch(`${baseUrl}/docs`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('swagger');
    });
  });

  describe('GET /', () => {
    it('should redirect to /docs with 302', async () => {
      const response = await fetch(`${baseUrl}/`, { redirect: 'manual' });
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/docs');
    });
  });
});
