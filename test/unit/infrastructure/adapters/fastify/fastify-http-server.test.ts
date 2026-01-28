import { FastifyHttpServer } from '../../../../../src/infrastructure/adapters/fastify/fastify-http-server';

describe('FastifyHttpServer error handler', () => {
  let server: FastifyHttpServer;

  beforeEach(() => {
    server = new FastifyHttpServer();
  });

  afterEach(async () => {
    await (server as unknown as { app: { close: () => Promise<void> } }).app.close();
  });

  it('should return 400 with validation error message when request fails schema validation', async () => {
    server.registerRoute({
      method: 'POST',
      path: '/test',
      handler: async () => {},
      schema: {
        body: {
          type: 'object',
          required: ['items'],
          properties: {
            items: {
              type: 'array',
              minItems: 1,
            },
          },
        },
      },
    });

    await server.start(0);
    const serverWithApp = server as unknown as {
      app: { server: { address: () => { port: number } | null } };
    };
    const address = serverWithApp.app.server.address();
    const port = address && typeof address === 'object' ? address.port : 0;

    const response = await fetch(`http://localhost:${port}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
    expect(typeof data.error).toBe('string');
  });

  it('should return 500 with internal server error when handler throws', async () => {
    server.registerRoute({
      method: 'POST',
      path: '/test',
      handler: () => {
        throw new Error('Unexpected');
      },
    });

    await server.start(0);
    const serverWithApp = server as unknown as {
      app: { server: { address: () => { port: number } | null } };
    };
    const address = serverWithApp.app.server.address();
    const port = address && typeof address === 'object' ? address.port : 0;

    const response = await fetch(`http://localhost:${port}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Internal server error');
  });
});

describe('FastifyHttpServer initializeSwagger', () => {
  let server: FastifyHttpServer;

  afterEach(async () => {
    await (server as unknown as { app: { close: () => Promise<void> } }).app.close();
  });

  it('should register Swagger and Swagger UI and serve /docs', async () => {
    server = new FastifyHttpServer();
    await server.initializeSwagger();
    await server.start(0);

    const serverWithApp = server as unknown as {
      app: { server: { address: () => { port: number } | null } };
    };
    const address = serverWithApp.app.server.address();
    const port = address && typeof address === 'object' ? address.port : 0;

    const docsResponse = await fetch(`http://localhost:${port}/docs`);
    expect(docsResponse.ok || docsResponse.status === 302).toBe(true);
  });
});
