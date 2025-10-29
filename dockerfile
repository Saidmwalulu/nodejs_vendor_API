# Use Bun official image (lightweight Alpine base)
FROM oven/bun:latest

# Set working directory inside the container
WORKDIR /app

# Copy package.json / bun.lockb (if exists)
COPY package*.json bun.lock* ./

# Install dependencies with Bun
RUN bun install

# Copy the rest of the app
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Run production start script
CMD ["bun", "start"]