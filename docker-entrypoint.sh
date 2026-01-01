#!/bin/sh
set -e

echo "Running database migrations..."
bunx prisma db push

echo "Starting DCA Bot..."
exec bun run start
