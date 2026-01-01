# Use the official Bun image as a base
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files
COPY bun.lockb package.json ./

# Copy prisma schema
COPY prisma ./prisma
COPY prisma.config.ts ./

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Copy the rest of your application code
COPY ./src ./src

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Command to run your application
ENTRYPOINT ["./docker-entrypoint.sh"]
