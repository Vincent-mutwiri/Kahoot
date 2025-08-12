#!/bin/bash

# Exit on error
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one based on .env.example"
    cp .env.example .env
    echo "A new .env file has been created. Please update it with your configuration and try again."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Start the development servers
echo "Starting development servers..."

# Start the frontend and backend in parallel
concurrently \
  "pnpm dev" \
  "pnpm server"
