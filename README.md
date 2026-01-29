# Purchase Cart Service
[![semantic-release: 📦🚀](https://img.shields.io/badge/semantic--release-📦🚀-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://conventionalcommits.org)
[![purchase-cart-service:latest](https://img.shields.io/badge/purchase--cart--service-blue?logo=docker)](https://github.com/cdemeo92/purchase-cart-service/pkgs/container/purchase-cart-service)

RESTful service that creates orders from a set of products.

## Table of contents

- [Requirements & scope](#requirements--scope)
- [Assumptions](#assumptions)
- [Project structure](#project-structure)
- [Demo](#demo)
- [Usage](#usage)
- [Installation](#installation)
- [Docker](#docker)
- [Scripts](#scripts)
- [Tech stack](#tech-stack)
- [Potential evolutions](#potential-evolutions)
- [Conventions](#conventions)
- [License](#license)

## Requirements & scope

The goals of this project are:

- Provide a REST API that, given a set of products, creates an order.
- Return for each order: the order id, the total price, the total VAT, and the price and VAT for each item.

## Assumptions

Core assumptions for this project:

- **Endpoint** – A single `POST /orders` endpoint receives the list of items (`productId` and `quantity`) and returns the created order.

- **Idempotency** - To support idempotency, the client may send an **optional** **idempotency key** in a request header (`Idempotency-Key`). 
    - If the `Idempotency-Key` is provided, any subsequent request with the same key returns the same `orderId` and does not create a new order.
    - If the `Idempotency-Key` is not provided, a new order is created.
    - If the same key is sent again with a **different body**, the request is rejected with **409 Conflict**, informing the client that an order was already created for that key.

- **Storage** – For this version, orders and product data are kept in memory. No database or file persistence is used, so data is lost on restart.

- **Pre-existing product catalog** – Products already exist and are known to the system. In the in-memory catalog each product has a unit price (excluding VAT), a VAT rate in percentage form (e.g. `0.22` for 22%), and an available quantity.

- **Fixed VAT per product** – Each product has a single VAT rate. VAT does not depend on delivery country, customer type, promotions, or exemptions.

- **Single currency** – All amounts are in one currency. There is no currency conversion.

- **Amount format** – Prices and VAT in the response are numbers with two decimal places. VAT is computed per product and accumulated into `totalVat`. `totalPrice` is the sum of the products’ prices per product plus `totalVat`.

- **Orders** – An order is created per request and is represented by an id, the list of items with resolved price and VAT per product, and the totals.

- **Order size** – No limit on the number of items per order.

- **Duplicate products in items** – If the same `productId` appears multiple times in the request, quantities are summed and the order is created with one line per product.

- **Order operations** – Only order creation is in scope. Consulting (get/list), updating, and cancelling orders are out of scope.

- **No authentication** – The service is public. Authentication and authorization are out of scope.

**Example** — `POST /orders` request and response:

Request body:

```json
{
  "items": [
    { "productId": "P001", "quantity": 2 },
    { "productId": "P002", "quantity": 1 }
  ]
}
```

Response (e.g. 201 Created):

```json
{
  "orderId": "ord_abc123",
  "totalPrice": 59.98,
  "totalVat": 11.98,
  "items": [
    { "productId": "P001", "quantity": 2, "price": 39.98, "vat": 7.98 },
    { "productId": "P002", "quantity": 1, "price": 20.00, "vat": 4.00 }
  ]
}
```

`totalVat` is the sum of VAT per product; `totalPrice` includes `totalVat`.

## Project structure

This project follows a **hexagonal architecture** (also known as ports and adapters) to ensure business logic remains independent from frameworks and infrastructure. The core application layer (`application/`) is completely reusable and can be integrated with different databases or HTTP frameworks by simply swapping adapters in the `infrastructure/` layer. This separation provides better testability, maintainability, and flexibility for future changes.

```
├── postman/
│   └── Purchase-Cart-Service.postman_collection.json   Postman collection (all API scenarios)
├── src/
│   ├── application/          Core business logic (framework-agnostic)
│   │   ├── domain/           Domain layer
│   │   │   ├── entities/     Domain entities (Order, Product, OrderItem)
│   │   │   ├── exceptions/   Domain exceptions
│   │   │   └── value-objects/ Value objects (Money)
│   │   ├── ports/            Interfaces (repository and HTTP server contracts)
│   │   └── use-cases/        Application use cases
│   ├── infrastructure/       Infrastructure adapters
│   │   ├── repositories/     Repository implementations
│   │   ├── database/         SQLite database initialization
│   │   └── adapters/
│   │       └── fastify/      Fastify HTTP adapter
│   └── main.ts               Composition root
├── test/
│   ├── unit/                 Unit tests (business logic)
│   ├── integ/                Integration tests (component integration)
│   └── e2e/                  End-to-end tests (full flows)
└── products/
    └── catalog.json          Product catalog (configurable via PRODUCTS_CATALOG_PATH)
```

## Demo

With [Docker](https://docs.docker.com/engine/install/) installed, from the project root:

```bash
./scripts/run.sh      # build image and run the service (port 3000)
./scripts/tests.sh    # build image and run all test suites in the container (unit, integ, e2e)
```

**Customizing configuration via environment variables:**

You can override the default port, product catalog path, and database path using environment variables:

```bash
# Custom port
PORT=8080 ./scripts/run.sh

# Custom product catalog (relative or absolute path)
PRODUCTS_CATALOG_PATH=./my-catalog.json ./scripts/run.sh

# Persist database to a file (path inside the container)
SQLITE_DB_PATH=/app/data/orders.sqlite ./scripts/run.sh

# Combine as needed
PORT=8080 PRODUCTS_CATALOG_PATH=/absolute/path/to/catalog.json SQLITE_DB_PATH=/app/data/orders.sqlite ./scripts/run.sh
```

The `run.sh` script automatically:
- Passes the `PORT` variable to the container (defaults to 3000)
- Mounts the catalog file into the container if `PRODUCTS_CATALOG_PATH` is provided
- Validates that the catalog file exists before starting the container

## Usage

**API Documentation**: Once the service is running, interactive API documentation is available at `http://localhost:3000/docs` (Swagger UI). You can explore endpoints, view request/response schemas, and test the API directly from the browser.

Use an HTTP client such as [Postman](https://www.postman.com/) or `curl` to call the API. A **Postman collection** with all scenarios (success, idempotency, 400/409/422) is available in [`postman/Purchase-Cart-Service.postman_collection.json`](./postman/Purchase-Cart-Service.postman_collection.json). Import it into Postman and set the `baseUrl` variable to `http://localhost:3000` (default) if needed. With the service running (e.g. on `http://localhost:3000`), you can try the following cases.

Products available in the demo catalog: see [`products/catalog.json`](./products/catalog.json).

**1. Create order (no idempotency key)** — each request creates a new order.

```http
POST http://localhost:3000/orders
Content-Type: application/json

{"items":[{"productId":"P001","quantity":2},{"productId":"P002","quantity":1}]}
```

→ **201 Created** — response includes `orderId`, `totalPrice`, `totalVat`, `items`.

**2. Create order with idempotency key (first call)** — order is created and the key is stored.

```http
POST http://localhost:3000/orders
Content-Type: application/json
Idempotency-Key: order-abc-123

{"items":[{"productId":"P001","quantity":2}]}
```

→ **201 Created** — response includes the new `orderId`.

**3. Same key, same body (retry or duplicate)** — no new order.

```http
POST http://localhost:3000/orders
Content-Type: application/json
Idempotency-Key: order-abc-123

{"items":[{"productId":"P001","quantity":2}]}
```

→ **201 Created** — same `orderId` as in step 2, no new order created.

**4. Same key, different body** — client error.

```http
POST http://localhost:3000/orders
Content-Type: application/json
Idempotency-Key: order-abc-123

{"items":[{"productId":"P002","quantity":5}]}
```

→ **409 Conflict** — an order was already created for that key; request is rejected.

**5. Non-existent product or quantity above availability** — at least one `productId` is not in the catalog, or the requested quantity (per product, after summing duplicates) exceeds available stock.

```http
POST http://localhost:3000/orders
Content-Type: application/json

{"items":[{"productId":"P999","quantity":1}]}
```
*(e.g. `P999` not in catalog)*

→ **422 Unprocessable Entity** — error payload indicates which product or item is invalid; no order is created.

**6. Invalid body** — malformed JSON, missing required fields, invalid types, or empty `items`. An empty `items` array is not allowed and yields **400 Bad Request**.

```http
POST http://localhost:3000/orders
Content-Type: application/json

{"items":[{"productId":"P001"}]}
```
*(e.g. missing `quantity`)*

→ **400 Bad Request** — error payload describes the validation failure; no order is created.

## Installation

### Prerequisites

- **[Node.js](https://nodejs.org/en)** >= 24  
- **npm** >= 11  
- [Docker](https://docs.docker.com/engine/install/)

### 1. Clone and install

```bash
git clone https://github.com/cdemeo92/purchase-cart-service.git
cd purchase-cart-service
npm i
```

### 2. Build and run

```bash
npm run build
npm start
```

The service runs on port 3000 by default. You can override this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

The product catalog is loaded from `products/catalog.json` by default. You can override this by setting the `PRODUCTS_CATALOG_PATH` environment variable:

```bash
PRODUCTS_CATALOG_PATH=/path/to/catalog.json npm start
```

The database is in-memory by default. To persist data to a file, set the `SQLITE_DB_PATH` environment variable to the path of the SQLite file (it will be created if it does not exist):

```bash
SQLITE_DB_PATH=/path/to/data.sqlite npm start
```

A running server will log on startup.

### 3. Run tests

```bash
npm test
```

### 4. (Optional) Dev Container

1. **Open the project** in VS Code or Cursor
2. **Open the Command Palette** (⇧⌘P on macOS, Ctrl+Shift+P on Windows/Linux) and run `Dev Containers: Rebuild and Reopen in Container`
3. **Wait for the container to build** – everything is set up automatically:
   - The container builds with all required tools preinstalled
   - Dependencies are installed automatically via `npm ci` (postCreateCommand; runs on first open)
   - No manual configuration is required – the container is fully preconfigured and ready to use

#### Benefits

- **Consistent environment across all developers** – everyone works in the same setup
- **Matches production environment** – the Dev Container uses the same `node:24` image as Docker, so local development matches the production environment
- **No local tool installation required** – you don't need to install Node.js, npm, or other tools; everything is preconfigured in the container
- **Isolated from system dependencies** – avoids conflicts with other projects or system packages

## Docker

The project is built and published automatically using the [project's GitHub Actions workflow](https://github.com/cdemeo92/purchase-cart-service/actions). Every push or merge to the main branch triggers the publish process.

**Run from the published image**:

```bash
docker pull ghcr.io/cdemeo92/purchase-cart-service:latest
docker run --rm -p 3000:3000 ghcr.io/cdemeo92/purchase-cart-service:latest
```

**Or build locally:**

```bash
docker build -t purchase-cart-service .
docker run --rm -p 3000:3000 purchase-cart-service
```

**Configuration via environment variables:**

You can override the default port, product catalog path, and database path using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `PRODUCTS_CATALOG_PATH` | Path to the products catalog JSON file | `products/catalog.json` |
| `SQLITE_DB_PATH` | Path to the SQLite database file; if unset, the app uses an in-memory database (data is lost on restart) | `:memory:` |

```bash
# Custom port
docker run --rm -p 8080:8080 -e PORT=8080 purchase-cart-service

# Custom product catalog (mount a volume with your catalog file)
docker run --rm -p 3000:3000 -v /path/to/catalog.json:/app/products/catalog.json purchase-cart-service

# Or use PRODUCTS_CATALOG_PATH
docker run --rm -p 3000:3000 -e PRODUCTS_CATALOG_PATH=/app/custom-catalog.json -v /path/to/catalog.json:/app/custom-catalog.json purchase-cart-service

# Persist database to a file (mount a volume for the SQLite file)
docker run --rm -p 3000:3000 -e SQLITE_DB_PATH=/app/data/orders.sqlite -v /path/to/data:/app/data purchase-cart-service
```

**Run tests inside the container** — pass the test suite as the command (works with the published image or a local build):

| Command | Runs |
|---------|------|
| `docker run --rm ghcr.io/cdemeo92/purchase-cart-service:latest test` | Unit tests only |
| `docker run --rm ghcr.io/cdemeo92/purchase-cart-service:latest test:integ` | Integration tests only |
| `docker run --rm ghcr.io/cdemeo92/purchase-cart-service:latest test:e2e` | E2E tests only |
| `docker run --rm ghcr.io/cdemeo92/purchase-cart-service:latest test:all` | All suites in sequence (unit → integ → e2e) |

The script `./scripts/tests.sh` builds the image and runs `test:all` by default.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the app (`node dist/index.js`) |
| `npm test` | Run unit tests with Jest |
| `npm run test:integ` | Run integration tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:all` | Run unit, integ, and e2e in sequence |
| `npm run test:ci` | Unit tests with coverage and JUnit output |
| `npm run lint` | Lint and fix with ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

## Tech stack

- [TypeScript](https://www.typescriptlang.org/), [Node.js](https://nodejs.org/)
- [Fastify](https://fastify.dev/)
- [Docker](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Potential evolutions

To make this service robust and production-ready, the following would be added or extended:

- **Persistence** – Use a database (e.g. PostgreSQL) for orders and, if needed, product catalog; introduce a repository layer and migrations.
- **Order operations** – Support for consulting (get/list), updating, and cancelling orders.
- **Security** – Authentication and authorization (e.g. JWT or API keys) and HTTPS only.


## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- Versioning and changelog are handled by Semantic Release.

## License

[ISC](LICENSE)
