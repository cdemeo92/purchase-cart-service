export const createOrderSchema = {
  operationId: 'createOrder',
  summary: 'Create a new order',
  description: 'Create a new order from a set of products',
  tags: ['Orders'],
  headers: {
    type: 'object',
    properties: {
      'idempotency-key': {
        type: 'string',
        description: 'Optional idempotency key for request deduplication',
      },
    },
  },
  body: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: {
              type: 'string',
              minLength: 1,
              description: 'Product identifier',
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantity of the product',
            },
          },
        },
      },
    },
  },
  response: {
    201: {
      description: 'Order created successfully',
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Unique order identifier',
        },
        totalPrice: {
          type: 'number',
          description: 'Total price including VAT (2 decimal places)',
        },
        totalVat: {
          type: 'number',
          description: 'Total VAT amount (2 decimal places)',
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: {
                type: 'string',
              },
              quantity: {
                type: 'integer',
              },
              price: {
                type: 'number',
                description: 'Price for this item (excluding VAT)',
              },
              vat: {
                type: 'number',
                description: 'VAT amount for this item',
              },
            },
          },
        },
      },
    },
    400: {
      description: 'Bad request - validation error',
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
    409: {
      description: 'Conflict - idempotency key conflict',
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
    422: {
      description: 'Unprocessable entity - business logic error',
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
  },
};
