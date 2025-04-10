# DataForSEO MCP Server

A Model Context Protocol (MCP) server implementation that provides access to DataForSEO's API services through a standardized interface. This server enables AI models to interact with DataForSEO's powerful SEO and marketing data tools.

## Features

- **Multiple API Modules**:
  - SERP API: Search Engine Results Page data
  - Keywords Data API: Keyword research and analysis
  - OnPage API: Website optimization insights
  - DataForSEO Labs API: Advanced SEO research tools

- **Modular Architecture**: Each API module can be enabled/disabled independently
- **TypeScript Implementation**: Full type safety and modern JavaScript features
- **Environment Configuration**: Easy setup through environment variables
- **Base Tool System**: Common functionality shared across all modules

## Prerequisites

- Node.js (v14 or higher)
- DataForSEO API credentials (username and password)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mcp-server-typescript
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Required
export DATAFORSEO_USERNAME=your_username
export DATAFORSEO_PASSWORD=your_password

# Optional - Enable/disable specific modules (default: all enabled)
export ENABLE_SERP_API=true
export ENABLE_KEYWORDS_API=true
export ENABLE_ONPAGE_API=true
export ENABLE_DATAFORSEO_LABS_API=true
```

## Building and Running

Build the project:
```bash
npm run build
```

Run the server:
```bash
node build/index.js
```

### Adding New Modules

1. Create a new directory under `src/modules/`
2. Extend the `BaseModule` class
3. Implement the required tools using the `BaseTool` class
4. Register the module in `src/index.ts`


## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/quickstart)
- [DataForSEO API Documentation](https://docs.dataforseo.com/)
