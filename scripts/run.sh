#!/bin/sh
set -e
cd "$(dirname "$0")/.."
docker build -t purchase-cart-service .
docker run --rm -p 3000:3000 purchase-cart-service
