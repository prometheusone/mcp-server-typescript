# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `npm run build` - Compile TypeScript and make CLI executable
- `npm run dev` - Run TypeScript in watch mode for development
- `npm start` - Run the built server (local MCP communication)
- `npm run http` - Start HTTP server mode
- `npm run sse` - Start SSE HTTP server mode

### Running the Server
- `npx dataforseo-mcp-server` - Local MCP server (stdio transport)
- `npx dataforseo-mcp-server http` - HTTP server mode on port 3000
- `npx dataforseo-mcp-server sse` - SSE HTTP server mode

### Testing
- Test client available at `src/test.ts`
- Run with: `npm run build && node dist/test.js`

## Architecture

This is a DataForSEO MCP Server that provides Claude with access to SEO data through the Model Context Protocol. The codebase follows a modular architecture where each DataForSEO API is implemented as a separate module.

### Core Design Pattern
1. **Base Classes**: `BaseModule` and `BaseTool` provide common functionality
2. **Module System**: Each API category (SERP, Keywords, OnPage, etc.) is a module in `src/modules/`
3. **Tool Pattern**: Individual API endpoints are "tools" within modules
4. **Transport Layer**: Supports stdio (default), HTTP, and SSE transports

### Key Entry Points
- `src/index.ts` - Main stdio server
- `src/index-http.ts` - HTTP transport server
- `src/index-sse-http.ts` - SSE HTTP with backwards compatibility
- `src/cli.ts` - CLI dispatcher that routes to appropriate server mode

### Adding New Features
- New API modules go in `src/modules/` and extend `BaseModule`
- New tools extend `BaseTool` and implement the `execute()` method
- Register modules in `src/config/modules.config.ts`
- Response filtering is controlled by `DATAFORSEO_FULL_RESPONSE` environment variable

### Configuration
Required environment variables:
- `DATAFORSEO_USERNAME` - DataForSEO API username
- `DATAFORSEO_PASSWORD` - DataForSEO API password

Optional:
- `ENABLED_MODULES` - Comma-separated list of modules to enable
- `DATAFORSEO_FULL_RESPONSE` - "true" for full responses, "false" for filtered
- `PORT` - HTTP server port (default: 3000)

### Deployment
- **Docker**: Multi-stage Dockerfile available, exposes port 3007
- **Nixpacks**: Configuration in `nixpacks.toml` defaults to SSE mode
- **NPM**: Published as `dataforseo-mcp-server` package