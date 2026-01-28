#!/bin/sh
set -e
cd "$(dirname "$0")/.."

PORT=${PORT:-3000}
PRODUCTS_CATALOG_PATH=${PRODUCTS_CATALOG_PATH:-}

docker build -t purchase-cart-service .

if [ -n "$PRODUCTS_CATALOG_PATH" ]; then
  if [ ! -f "$PRODUCTS_CATALOG_PATH" ]; then
    echo "Error: PRODUCTS_CATALOG_PATH file does not exist: $PRODUCTS_CATALOG_PATH" >&2
    exit 1
  fi
  ABSOLUTE_PATH=$(cd "$(dirname "$PRODUCTS_CATALOG_PATH")" && pwd)/$(basename "$PRODUCTS_CATALOG_PATH")
  docker run --rm -p ${PORT}:${PORT} -e PORT=${PORT} -e PRODUCTS_CATALOG_PATH=/app/custom-catalog.json -v "${ABSOLUTE_PATH}:/app/custom-catalog.json:ro" purchase-cart-service
else
  docker run --rm -p ${PORT}:${PORT} -e PORT=${PORT} purchase-cart-service
fi
