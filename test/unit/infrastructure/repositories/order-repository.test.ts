import type Database from 'better-sqlite3';
import { OrderRepository } from '../../../../src/infrastructure/repositories/order-repository';
import { Order, OrderItem } from '../../../../src/application/domain/entities';
import { Money } from '../../../../src/application/domain/value-objects/money';

function createMockDb(): Database.Database {
  const runMock = jest.fn();
  const prepareMock = jest.fn(() => ({ run: runMock }));
  const transactionMock = jest.fn((fn: () => void) => () => fn());
  return {
    prepare: prepareMock,
    transaction: transactionMock,
  } as unknown as Database.Database;
}

describe('OrderRepository', () => {
  let db: Database.Database;
  let repository: OrderRepository;

  beforeEach(() => {
    db = createMockDb();
    repository = new OrderRepository(db);
  });

  describe('save', () => {
    it('should prepare insert order and insert item SQL then run transaction', async () => {
      const runOrder = jest.fn();
      const runItem = jest.fn();
      (db.prepare as jest.Mock)
        .mockReturnValueOnce({ run: runOrder })
        .mockReturnValueOnce({ run: runItem });
      (db.transaction as jest.Mock).mockImplementation((fn: () => void) => {
        fn();
        return jest.fn();
      });
      const order = new Order([], new Money(10), new Money(2));

      await repository.save(order, 'key-123');

      expect(db.prepare).toHaveBeenCalledTimes(2);
      expect(db.transaction).toHaveBeenCalledTimes(1);
      expect(runOrder).toHaveBeenCalledWith(order.id, 10, 2, null, 'key-123');
    });

    it('should pass idempotencyKey null when not provided', async () => {
      const runOrder = jest.fn();
      const runItem = jest.fn();
      (db.prepare as jest.Mock)
        .mockReturnValueOnce({ run: runOrder })
        .mockReturnValueOnce({ run: runItem });
      (db.transaction as jest.Mock).mockImplementation((fn: () => void) => {
        fn();
        return jest.fn();
      });
      const order = new Order([], new Money(10), new Money(2));

      await repository.save(order);

      expect(runOrder).toHaveBeenCalledWith(order.id, 10, 2, null, null);
    });

    it('should insert items with order id and position', async () => {
      const runOrder = jest.fn();
      const runItem = jest.fn();
      (db.prepare as jest.Mock)
        .mockReturnValueOnce({ run: runOrder })
        .mockReturnValueOnce({ run: runItem });
      (db.transaction as jest.Mock).mockImplementation((fn: () => void) => {
        fn();
        return jest.fn();
      });
      const orderItems = [new OrderItem('P001', 2, new Money(39.98), new Money(7.98))];
      const order = new Order(orderItems, new Money(47.96), new Money(7.98), undefined, 'ord-1');

      await repository.save(order, 'key');

      expect(runItem).toHaveBeenCalledWith('ord-1', 0, 'P001', 2, 39.98, 7.98);
    });

    it('should throw when transaction callback throws', async () => {
      (db.prepare as jest.Mock).mockReturnValue({ run: jest.fn() });
      (db.transaction as jest.Mock).mockImplementation(() => () => {
        throw new Error('DB closed');
      });
      const order = new Order([], new Money(10), new Money(2));

      await expect(repository.save(order, 'key')).rejects.toThrow('DB closed');
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return order when prepare().all() returns rows', async () => {
      const rows = [
        {
          id: 'ord-1',
          total_price: 10,
          total_vat: 2,
          body_hash: null,
          product_id: null,
          quantity: null,
          price_value: null,
          vat_value: null,
        },
      ];
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue(rows),
      });

      const result = await repository.findByIdempotencyKey('key-123');

      expect(db.prepare).toHaveBeenCalledTimes(1);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('ord-1');
      expect(result!.totalPrice.value).toBe(10);
      expect(result!.totalVat.value).toBe(2);
      expect(result!.items).toHaveLength(0);
    });

    it('should return null when prepare().all() returns empty array', async () => {
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue([]),
      });

      const result = await repository.findByIdempotencyKey('key-999');

      expect(result).toBeNull();
    });

    it('should return order with items when rows contain order_items', async () => {
      const rows = [
        {
          id: 'ord-fixed',
          total_price: 47.96,
          total_vat: 7.98,
          body_hash: null,
          product_id: 'P001',
          quantity: 2,
          price_value: 39.98,
          vat_value: 7.98,
        },
      ];
      (db.prepare as jest.Mock).mockReturnValue({
        all: jest.fn().mockReturnValue(rows),
      });

      const result = await repository.findByIdempotencyKey('key-items');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('ord-fixed');
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].productId).toBe('P001');
      expect(result!.items[0].quantity).toBe(2);
      expect(result!.items[0].price.value).toBe(39.98);
      expect(result!.items[0].vat.value).toBe(7.98);
    });

    it('should call all with idempotencyKey argument', async () => {
      const allMock = jest.fn().mockReturnValue([]);
      (db.prepare as jest.Mock).mockReturnValue({ all: allMock });

      await repository.findByIdempotencyKey('my-key');

      expect(allMock).toHaveBeenCalledWith('my-key');
    });
  });
});
