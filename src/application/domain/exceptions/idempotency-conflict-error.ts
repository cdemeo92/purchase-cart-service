export class IdempotencyConflictError extends Error {
  constructor(idempotencyKey: string) {
    super(
      `Idempotency key conflict: ${idempotencyKey}. An order was already created with a different body.`,
    );
    this.name = 'IdempotencyConflictError';
  }
}
