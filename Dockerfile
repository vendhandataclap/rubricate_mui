# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Build the Vite app
ARG VITE_API_URL=http://backend:5000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage - Serve built app on port 3000
FROM node:20-alpine

WORKDIR /app

# Install serve to serve the built React app
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port 3000 (for central Nginx to proxy to)
EXPOSE 5173

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1

# Serve the React app on port 3000
# -s flag enables SPA routing (redirects all requests to index.html for React Router)
CMD ["serve", "-s", "dist", "-l", "5173"]

