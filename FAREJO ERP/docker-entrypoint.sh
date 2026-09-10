#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Running database migrations..."
  pnpm exec drizzle-kit migrate
fi

echo "Starting server..."
exec node dist/index.js
