# Purchase Cart Service
[![semantic-release: 📦🚀](https://img.shields.io/badge/semantic--release-📦🚀-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-blue.svg)](https://conventionalcommits.org)
[![purchase-cart-service:latest](https://img.shields.io/badge/purchase--cart--service-blue?logo=docker)](https://github.com/cdemeo92/purchase-cart-service/pkgs/container/purchase-cart-service)

RESTful service that creates orders from a set of products. It returns the order id, total price, total VAT, and price and VAT for each item.

## Project structure

```
├── src/                      Application source
│   └── index.ts              Entry point
└── test/
    └── unit/                 Unit tests
        └── index.test.ts
```

## Demo

With [Docker](https://docs.docker.com/engine/install/) installed, from the project root:

```bash
./scripts/run.sh      # build image and run the service (port 3000)
./scripts/tests.sh    # build image and run tests in container
```

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

The service runs on the port defined by the app (e.g. 3000). A running server will log on startup.

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
- **Matches production environment** – the Dev Container uses the same `node:24-alpine` image as Docker, so local development matches the production environment
- **No local tool installation required** – you don't need to install Node.js, npm, or other tools; everything is preconfigured in the container
- **Isolated from system dependencies** – avoids conflicts with other projects or system packages

## Docker

**Run from the published image** (port 3000):

```bash
docker pull ghcr.io/cdemeo92/purchase-cart-service:latest
docker run --rm -p 3000:3000 ghcr.io/cdemeo92/purchase-cart-service:latest
```

**Or build locally:**

```bash
docker build -t purchase-cart-service .
docker run --rm -p 3000:3000 purchase-cart-service
```

**Run tests inside the container** (works with either the published image or a local build):

```bash
docker run --rm ghcr.io/cdemeo92/purchase-cart-service:latest test
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the app (`node dist/index.js`) |
| `npm test` | Run tests with Jest |
| `npm run test:ci` | Tests with coverage and JUnit output |
| `npm run lint` | Lint and fix with ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm run release` | Semantic release (conventional commits) |

## Tech stack

- TypeScript, Node.js
- Docker (node:24-alpine)

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- Versioning and changelog are handled by Semantic Release.

## License

ISC
