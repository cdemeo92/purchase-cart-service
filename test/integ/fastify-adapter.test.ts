import type { IHttpServer } from '../../src/application/ports';
import { FastifyHttpServer } from '../../src/infrastructure/adapters/fastify';

describe('FastifyHttpServer', () => {
  let server: IHttpServer;
  let fastifyInstance: FastifyHttpServer;

  beforeEach(() => {
    fastifyInstance = new FastifyHttpServer();
    server = fastifyInstance;
  });

  afterEach(async () => {
    await (fastifyInstance as unknown as { app: { close: () => Promise<void> } }).app.close();
  });

  describe('registerRoute', () => {
    it('should register route and handle request', async () => {
      const handler = jest.fn().mockResolvedValue({ message: 'ok' });
      server.registerRoute({ method: 'POST', path: '/test', handler });

      await server.start(0);
      const app = (
        fastifyInstance as unknown as {
          app: { server: { address: () => { port: number } | null } };
        }
      ).app;
      const address = app.server.address();
      const port = address && typeof address === 'object' ? address.port : 0;

      const response = await fetch(`http://localhost:${port}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      expect(response.ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', () => {
    it('should start server on specified port', async () => {
      await server.start(3001);
      const app = (
        fastifyInstance as unknown as {
          app: { server: { address: () => { port: number } | null } };
        }
      ).app;
      const address = app.server.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      expect(port).toBe(3001);
    });
  });
});
