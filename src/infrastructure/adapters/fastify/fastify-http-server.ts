import fastify from 'fastify';
import type {
  FastifyInstance,
  FastifyError,
  FastifyRequest,
  FastifyReply,
  FastifySchema,
} from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { IHttpServer, RegisterRouteOptions } from '../../../application/ports';

function getPublicUrl(): string {
  const url = process.env.PUBLIC_URL?.trim();
  if (url) return url.endsWith('/') ? url.slice(0, -1) : url;
  return 'http://localhost:3000';
}

export class FastifyHttpServer implements IHttpServer {
  private app: FastifyInstance;

  constructor() {
    this.app = fastify();
    this.setupRequestLogging();
    this.setupErrorHandler();
  }

  private setupRequestLogging(): void {
    this.app.addHook('onRequest', (request: FastifyRequest, _reply, done) => {
      (request as FastifyRequest & { startTime?: number }).startTime = Date.now();
      done();
    });
    this.app.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
      const start = (request as FastifyRequest & { startTime?: number }).startTime!;
      const ms = Date.now() - start;
      console.log(`request | ${request.method} ${request.url} | ${reply.statusCode} | ${ms}ms`);
      done();
    });
  }

  private setupErrorHandler(): void {
    this.app.setErrorHandler(
      (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (error.validation) {
          const message = error.validation[0]?.message ?? 'Validation error';
          console.error(`error | ${request.method} ${request.url} | 400 | ${message}`);
          return reply.code(400).send({ error: message });
        }

        console.error(
          `error | ${request.method} ${request.url} | 500 | ${error.message}`,
          error.stack,
        );
        return reply.code(500).send({ error: 'Internal server error' });
      },
    );
  }

  public async initializeSwagger(): Promise<void> {
    await this.app.register(swagger, {
      openapi: {
        info: {
          title: 'Purchase Cart Service',
          description: 'RESTful service that creates orders from a set of products',
          version: process.env.npm_package_version || '1.0.0',
        },
        servers: [
          {
            url: getPublicUrl(),
            description: 'Purchase Cart Service',
          },
        ],
      },
    });

    await this.app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    this.app.route({
      method: 'GET',
      url: '/',
      handler: async (_request, reply) => reply.redirect('/docs', 302),
      schema: { hide: true },
    });
  }

  public async start(port: number): Promise<void> {
    await this.app.ready();
    await this.app.listen({ port, host: '0.0.0.0' });
  }

  public registerRoute(options: RegisterRouteOptions): void {
    this.app.route({
      method: options.method,
      url: options.path,
      handler: options.handler,
      schema: options.schema as FastifySchema,
    });
  }
}
