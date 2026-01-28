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

export class FastifyHttpServer implements IHttpServer {
  private app: FastifyInstance;

  constructor() {
    this.app = fastify();
    this.setupErrorHandler();
  }

  private setupErrorHandler(): void {
    this.app.setErrorHandler(
      (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        if (error.validation) {
          const message = error.validation[0]?.message ?? 'Validation error';
          return reply.code(400).send({ error: message });
        }

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
            url: 'http://localhost:3000',
            description: 'Development server',
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
