#!/bin/sh
set -e
case "${1:-start}" in
  test)      exec npm test ;;
  test:integ) exec npm run test:integ ;;
  test:e2e)  exec npm run test:e2e ;;
  test:all)  exec npm run test:all ;;
  start)     exec npm start ;;
  *)         exec "$@" ;;
esac
