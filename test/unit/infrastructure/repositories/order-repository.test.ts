import Database from 'better-sqlite3';
import { openDb, runSchema } from '../../../../src/infrastructure/database/sqlite';
import { OrderRepository } from '../../../../src/infrastructure/repositories/order-repository';
import { Order, OrderItem } from '../../../../src/application/domain/entities';
import { Money } from '../../../../src/application/domain/value-objects/money';

describe('OrderRepository', () => {
  let db: InstanceType<typeof Database>;
  let repository: OrderRepository;

  beforeEach(() => {
    db = openDb();
    runSchema(db);
    repository = new OrderRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('save', () => {
    it('should save order and store by idempotency key when provided', async () => {
      const order = new Order([], new Money(10), new Money(2));

      await repository.save(order, 'key-123');

      const result = await repository.findByIdempotencyKey('key-123');
      expect(result).not.toBeNull();
      expect(result!.id).toBe(order.id);
      expect(result!.totalPrice.value).toBe(10);
      expect(result!.totalVat.value).toBe(2);
      expect(result!.items).toHaveLength(0);
    });

    it('should save order without idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));

      await expect(repository.save(order)).resolves.not.toThrow();
    });

    it('should throw when database is closed', async () => {
      const closedDb = openDb();
      runSchema(closedDb);
      const closedRepo = new OrderRepository(closedDb);
      closedDb.close();
      const order = new Order([], new Money(10), new Money(2));

      await expect(Promise.resolve().then(() => closedRepo.save(order))).rejects.toBeDefined();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return order when found by idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));
      await repository.save(order, 'key-123');

      const result = await repository.findByIdempotencyKey('key-123');

      expect(result).not.toBeNull();
      expect(result!.id).toBe(order.id);
      expect(result!.totalPrice.value).toBe(10);
      expect(result!.totalVat.value).toBe(2);
    });

    it('should return null when no order with idempotency key', async () => {
      const result = await repository.findByIdempotencyKey('key-999');
      expect(result).toBeNull();
    });

    it('should return null when order saved without idempotency key', async () => {
      const order = new Order([], new Money(10), new Money(2));
      await repository.save(order);

      const result = await repository.findByIdempotencyKey('key-123');
      expect(result).toBeNull();
    });

    it('should throw when database is closed', async () => {
      const closedDb = openDb();
      runSchema(closedDb);
      const closedRepo = new OrderRepository(closedDb);
      closedDb.close();

      await expect(
        Promise.resolve().then(() => closedRepo.findByIdempotencyKey('key-123')),
      ).rejects.toBeDefined();
    });

    it('should return order with items when order has items', async () => {
      const orderItems = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(
        orderItems,
        new Money(47.96),
        new Money(7.98),
        undefined,
        'ord-fixed-id',
      );
      await repository.save(order, 'key-with-items');

      const result = await repository.findByIdempotencyKey('key-with-items');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ord-fixed-id');
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].productId).toBe('P001');
      expect(result!.items[0].quantity).toBe(2);
      expect(result!.items[0].price.value).toBe(39.98);
      expect(result!.items[0].vat.value).toBe(7.98);
    });
  });
});
