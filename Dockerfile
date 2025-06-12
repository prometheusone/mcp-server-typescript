FROM node:20-alpine

WORKDIR /app

# Install the DataForSEO MCP server from npm
RUN npm install -g dataforseo-mcp-server

# Create a simple health check endpoint
RUN echo '{"status":"healthy"}' > health.json

# Environment variables will be set by Coolify
ENV PORT=3000

EXPOSE 3000

# Run the server
CMD ["dataforseo-mcp-server", "sse"]
