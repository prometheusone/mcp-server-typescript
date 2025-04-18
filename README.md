# DataForSEO MCP Server

A Model Context Protocol (MCP) server implementation that provides access to DataForSEO's API services through a standardized interface. This server enables AI models to interact with DataForSEO's powerful SEO and marketing data tools.

## Features

- SERP API: Search Engine Results Page data
- KEYWORDS_DATA API: Keyword research and analysis
- ONPAGE API: Website optimization insights
- DATAFORSEO_LABS API: Advanced SEO research tools

## Prerequisites

- Node.js (v14 or higher)
- DataForSEO API credentials (username and password)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/dataforseo/mcp-server-typescript
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

# Optional - Specify which modules to enable (comma-separated)
# If not set, all modules will be enabled
export ENABLED_MODULES="SERP,KEYWORDS_DATA,ONPAGE,DATAFORSEO_LABS"
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

## Available Modules

The following modules are available to be enabled/disabled:

- `SERP`: Search Engine Results Page data
- `KEYWORDS_DATA`: Keyword research and analysis
- `ONPAGE`: Website optimization insights
- `DATAFORSEO_LABS`: Advanced SEO research tools

## What endpoints/APIs you want to support next?

We're always looking to expand the capabilities of this MCP server. If you have specific DataForSEO endpoints or APIs you'd like to see supported, please:

1. Check the [DataForSEO API Documentation](https://docs.dataforseo.com/v3/) to see what's available
2. Open an issue in our GitHub repository with:
   - The API/endpoint you'd like to see supported
   - A brief description of its use case
   - Any specific features you'd like to see implemented

Your input helps us prioritize which APIs to support next!

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/quickstart)
- [DataForSEO API Documentation](https://docs.dataforseo.com/)
