import { FastifyHttpServer } from '../../../../../src/infrastructure/adapters/fastify/fastify-http-server';

describe('FastifyHttpServer', () => {
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

    await server.start(3099);
    const response = await fetch(`http://localhost:3099/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBeDefined();
  });

  it('should return 400 with Validation error when validation array is empty', async () => {
    server.registerRoute({
      method: 'POST',
      path: '/empty-validation',
      handler: () => {
        const err = new Error() as Error & { validation: unknown[] };
        err.validation = [];
        throw err;
      },
    });

    await server.start(3099);
    const response = await fetch(`http://localhost:3099/empty-validation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Validation error');
  });

  it('should return 500 with internal server error when handler throws', async () => {
    server.registerRoute({
      method: 'POST',
      path: '/test',
      handler: () => {
        throw new Error('Unexpected');
      },
    });

    await server.start(3099);
    const response = await fetch(`http://localhost:3099/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(500);
    const data = (await response.json()) as { error: string };
    expect(data.error).toBe('Internal server error');
  });

  it('should redirect GET / to /docs', async () => {
    await server.initializeSwagger();
    await server.start(3099);

    const response = await fetch(`http://localhost:3099/`, {
      redirect: 'manual',
    });
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/docs');
  });

  it('should register Swagger and Swagger UI and serve /docs', async () => {
    await server.initializeSwagger();
    await server.start(3099);

    const docsResponse = await fetch(`http://localhost:3099/docs`);
    expect(docsResponse.ok || docsResponse.status === 302).toBe(true);
  });

  it('should use PUBLIC_URL in OpenAPI servers when set', async () => {
    const originalUrl = process.env.PUBLIC_URL;
    process.env.PUBLIC_URL = 'https://api.example.com';
    try {
      await server.initializeSwagger();
      await server.start(3099);

      const app = server as unknown as { app: { swagger: () => { servers?: { url: string }[] } } };
      const spec = app.app.swagger();
      expect(spec.servers?.[0]?.url).toBe('https://api.example.com');
    } finally {
      if (originalUrl !== undefined) process.env.PUBLIC_URL = originalUrl;
      else delete process.env.PUBLIC_URL;
    }
  });

  it('should strip trailing slash from PUBLIC_URL in OpenAPI servers', async () => {
    const originalUrl = process.env.PUBLIC_URL;
    process.env.PUBLIC_URL = 'https://api.example.com/';
    try {
      await server.initializeSwagger();
      await server.start(3099);

      const app = server as unknown as { app: { swagger: () => { servers?: { url: string }[] } } };
      const spec = app.app.swagger();
      expect(spec.servers?.[0]?.url).toBe('https://api.example.com');
    } finally {
      if (originalUrl !== undefined) process.env.PUBLIC_URL = originalUrl;
      else delete process.env.PUBLIC_URL;
    }
  });

  describe('initializeSwagger', () => {
    it('should register OpenAPI spec with info title, description and version', async () => {
      await server.initializeSwagger();
      await server.start(3099);

      const app = server as unknown as {
        app: {
          swagger: () => { info?: { title?: string; description?: string; version?: string } };
        };
      };
      const spec = app.app.swagger();
      expect(spec.info?.title).toBe('Purchase Cart Service');
      expect(spec.info?.description).toBe(
        'RESTful service that creates orders from a set of products',
      );
      expect(spec.info?.version).toBeDefined();
      expect(typeof spec.info?.version).toBe('string');
    });

    it('should set info version to 1.0.0 when npm_package_version is not set', async () => {
      const originalVersion = process.env.npm_package_version;
      delete process.env.npm_package_version;
      try {
        await server.initializeSwagger();
        await server.start(3099);

        const app = server as unknown as {
          app: { swagger: () => { info?: { version?: string } } };
        };
        const spec = app.app.swagger();
        expect(spec.info?.version).toBe('1.0.0');
      } finally {
        if (originalVersion !== undefined) process.env.npm_package_version = originalVersion;
      }
    });

    it('should set info version to npm_package_version when set', async () => {
      const originalVersion = process.env.npm_package_version;
      process.env.npm_package_version = '2.5.0';
      try {
        await server.initializeSwagger();
        await server.start(3099);

        const app = server as unknown as {
          app: { swagger: () => { info?: { version?: string } } };
        };
        const spec = app.app.swagger();
        expect(spec.info?.version).toBe('2.5.0');
      } finally {
        if (originalVersion !== undefined) process.env.npm_package_version = originalVersion;
        else delete process.env.npm_package_version;
      }
    });

    it('should set server url to http://localhost:3000 when PUBLIC_URL is not set', async () => {
      const originalUrl = process.env.PUBLIC_URL;
      delete process.env.PUBLIC_URL;
      try {
        await server.initializeSwagger();
        await server.start(3099);

        const app = server as unknown as {
          app: { swagger: () => { servers?: { url: string }[] } };
        };
        const spec = app.app.swagger();
        expect(spec.servers?.[0]?.url).toBe('http://localhost:3000');
      } finally {
        if (originalUrl !== undefined) process.env.PUBLIC_URL = originalUrl;
      }
    });

    it('should set server url to PUBLIC_URL when PUBLIC_URL is set', async () => {
      const originalUrl = process.env.PUBLIC_URL;
      process.env.PUBLIC_URL = 'https://api.example.com';
      try {
        await server.initializeSwagger();
        await server.start(3099);

        const app = server as unknown as {
          app: { swagger: () => { servers?: { url: string }[] } };
        };
        const spec = app.app.swagger();
        expect(spec.servers?.[0]?.url).toBe('https://api.example.com');
      } finally {
        if (originalUrl !== undefined) process.env.PUBLIC_URL = originalUrl;
        else delete process.env.PUBLIC_URL;
      }
    });
  });

  describe('registerRoute', () => {
    it('should register a route that responds with handler result', async () => {
      server.registerRoute({
        method: 'GET',
        path: '/ping',
        handler: async (_req, reply) => {
          (reply as { code: (n: number) => { send: (b: unknown) => void } })
            .code(200)
            .send({ pong: true });
        },
      });

      await server.start(3099);
      const response = await fetch(`http://localhost:3099/ping`);

      expect(response.status).toBe(200);
      const data = (await response.json()) as { pong: boolean };
      expect(data.pong).toBe(true);
    });
  });
});
