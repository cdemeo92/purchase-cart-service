FROM node:24

WORKDIR /app

COPY . .
RUN npm ci && npm run build

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
CMD ["start"]
