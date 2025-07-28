# Gunakan Bun official image
FROM oven/bun:1.1.13 as base

# Set working directory
WORKDIR /app

# Salin package.json, bun.lockb, dan file env agar bisa cache dependencies
COPY bun.lockb package.json ./

# Install dependencies
RUN bun install

# Salin semua file project ke dalam container
COPY . .

# Build aplikasi Next.js (jika menggunakan app dir, bun akan tahu)
RUN bun run build

# Jalankan server Next.js
CMD ["bun", "run", "start"]
