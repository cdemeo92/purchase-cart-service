#!/bin/sh
set -e
cd "$(dirname "$0")/.."
docker build -t purchase-cart-service .
docker run --rm purchase-cart-service test:all
