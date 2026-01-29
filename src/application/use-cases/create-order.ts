import { createHash } from 'crypto';
import type { IProductRepository, IOrderRepository } from '../ports';
import { Order, OrderItem } from '../domain/entities';
import type { Product } from '../domain/entities';
import { Money } from '../domain/value-objects/money';
import {
  ProductNotFoundError,
  InsufficientStockError,
  IdempotencyConflictError,
} from '../domain/exceptions';

export interface CreateOrderRequest {
  items: Array<{ productId: string; quantity: number }>;
}

export interface CreateOrderResponse {
  orderId: string;
  totalPrice: number;
  totalVat: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    vat: number;
  }>;
}

type AggregatedItem = { productId: string; quantity: number };

export class CreateOrderUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(
    request: CreateOrderRequest,
    idempotencyKey?: string,
  ): Promise<CreateOrderResponse> {
    const requestBodyHash = this.hashBody(request);
    const existingOrder = await this.resolveExistingOrder(idempotencyKey, requestBodyHash);
    if (existingOrder) {
      return this.toResponse(existingOrder);
    }

    const aggregatedItems = this.aggregateItemsByProductId(request.items);
    const productMap = await this.productRepository.findByIds(
      aggregatedItems.map((item) => item.productId),
    );
    const order = this.buildOrder(aggregatedItems, productMap, requestBodyHash);

    await this.orderRepository.save(order, idempotencyKey);
    return this.toResponse(order);
  }

  private async resolveExistingOrder(
    idempotencyKey: string | undefined,
    requestBodyHash: string,
  ): Promise<Order | null> {
    if (!idempotencyKey) return null;

    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (!existingOrder) return null;

    if (existingOrder.bodyHash && existingOrder.bodyHash !== requestBodyHash) {
      throw new IdempotencyConflictError(idempotencyKey);
    }
    return existingOrder;
  }

  private buildOrder(
    aggregatedItems: AggregatedItem[],
    productMap: Map<string, Product>,
    requestBodyHash: string,
  ): Order {
    const orderItems: OrderItem[] = [];
    let totalPrice = new Money(0);
    let totalVat = new Money(0);

    for (const item of aggregatedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ProductNotFoundError(item.productId);
      }
      if (!product.hasEnoughStock(item.quantity)) {
        throw new InsufficientStockError(item.productId, item.quantity, product.availableQuantity);
      }
      const itemPrice = new Money(product.unitPrice).multiply(item.quantity);
      const itemVat = itemPrice.multiply(product.vatRate);
      orderItems.push(new OrderItem(item.productId, item.quantity, itemPrice, itemVat));
      totalPrice = totalPrice.add(itemPrice).add(itemVat);
      totalVat = totalVat.add(itemVat);
    }

    return new Order(orderItems, totalPrice, totalVat, requestBodyHash);
  }

  private toResponse(order: Order): CreateOrderResponse {
    return {
      orderId: order.id,
      totalPrice: order.totalPrice.value,
      totalVat: order.totalVat.value,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price.value,
        vat: item.vat.value,
      })),
    };
  }

  private hashBody(request: CreateOrderRequest): string {
    return createHash('sha256').update(JSON.stringify(request)).digest('hex');
  }

  private aggregateItemsByProductId(
    items: Array<{ productId: string; quantity: number }>,
  ): Array<{ productId: string; quantity: number }> {
    const byId = new Map<string, number>();
    const order: string[] = [];
    for (const item of items) {
      const current = byId.get(item.productId) ?? 0;
      if (current === 0) order.push(item.productId);
      byId.set(item.productId, current + item.quantity);
    }
    return order.map((productId) => ({
      productId,
      quantity: byId.get(productId)!,
    }));
  }
}
