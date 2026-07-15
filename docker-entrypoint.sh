#!/bin/sh
set -eu

echo "Running database migrations..."
npm run migration:run:prod

if [ "${RUN_DB_SEED:-true}" = "true" ]; then
  echo "Installing demo product images..."
  mkdir -p "${UPLOAD_DIR:-/app/uploads}/products"
  cp -f /app/seed-assets/products/* "${UPLOAD_DIR:-/app/uploads}/products/"

  echo "Seeding demo data..."
  npm run seed:prod
else
  echo "Skipping demo data seed (RUN_DB_SEED=${RUN_DB_SEED:-false})."
fi

echo "Starting backend..."
exec node dist/main.js
