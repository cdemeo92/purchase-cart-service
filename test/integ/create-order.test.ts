import Database from 'better-sqlite3';
import { openDb, runMigrations } from '../../src/infrastructure/database/sqlite';
import { ProductRepository } from '../../src/infrastructure/repositories/product-repository';
import { OrderRepository } from '../../src/infrastructure/repositories/order-repository';
import { CreateOrderUseCase } from '../../src/application/use-cases/create-order';

describe('CreateOrder (integration)', () => {
  let db: InstanceType<typeof Database>;
  let useCase: CreateOrderUseCase;
  let orderRepository: OrderRepository;

  beforeEach(() => {
    db = openDb();
    runMigrations(db);
    const productRepository = new ProductRepository(db);
    orderRepository = new OrderRepository(db);
    useCase = new CreateOrderUseCase(productRepository, orderRepository);
  });

  afterEach(() => {
    if (db) db.close();
  });

  it('should create order and persist it via repositories', async () => {
    const result = await useCase.execute(
      { items: [{ productId: 'P001', quantity: 2 }] },
      'key-123',
    );

    expect(result.orderId).toBeDefined();
    expect(result.totalPrice).toBe(48.8);
    expect(result.items).toHaveLength(1);

    const found = await orderRepository.findByIdempotencyKey('key-123');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(result.orderId);
    expect(found!.totalPrice.value).toBe(result.totalPrice);
  });
});
