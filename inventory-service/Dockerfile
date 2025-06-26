# Use Node.js LTS version
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy package files
COPY inventory-service/package*.json ./

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Copy source code
COPY inventory-service/. .
COPY proto /proto

# Change ownership of the app
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports for REST API and gRPC
EXPOSE 8082 9092

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

# Start the application
CMD ["npm", "start"] 