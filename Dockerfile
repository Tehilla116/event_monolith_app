# Use official Bun image
FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy application code
FROM base AS prerelease
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Production stage
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY --from=prerelease /app .

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Run the app
CMD ["bun", "src/index.ts"]
