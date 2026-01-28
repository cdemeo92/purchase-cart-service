export interface RegisterRouteOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: (req: unknown, reply: unknown) => Promise<unknown>;
  schema?: unknown;
}

export interface IHttpServer {
  initializeSwagger(): Promise<void>;
  start(port: number): Promise<void>;
  registerRoute(options: RegisterRouteOptions): void;
}
