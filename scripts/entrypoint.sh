#!/bin/sh
set -e
case "${1:-start}" in
  test)  exec npm test ;;
  start) exec npm start ;;
  *)     exec "$@" ;;
esac
