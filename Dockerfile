FROM oven/bun:1 AS base

# Install PostgreSQL server
RUN apt-get update && \
    apt-get install -y postgresql postgresql-contrib && \
    rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /app

# Copy dependency file
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy seluruh project
COPY . .

# Build Next.js
RUN bun run build

# Buat data folder untuk PostgreSQL
RUN mkdir -p /var/lib/postgresql/data && chown -R postgres:postgres /var/lib/postgresql

# Expose port Next.js dan PostgreSQL
EXPOSE 3000 5432

# Script entrypoint untuk menjalankan PostgreSQL & Next.js
CMD service postgresql start && \
    su postgres -c "psql -c \"CREATE USER nextjs WITH PASSWORD 'password';\"" && \
    su postgres -c "psql -c \"CREATE DATABASE nextjsdb OWNER nextjs;\"" && \
    bun start
