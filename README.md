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

## Adding New Tools/Modules

### Module Structure

Each module corresponds to a specific DataForSEO API:
- `SERP` module → [SERP API](https://docs.dataforseo.com/v3/serp/)
- `KEYWORDS_DATA` module → [Keywords Data API](https://docs.dataforseo.com/v3/keywords_data/)
- `ONPAGE` module → [OnPage API](https://docs.dataforseo.com/v3/on_page/)
- `DATAFORSEO_LABS` module → [DataForSEO Labs API](https://docs.dataforseo.com/v3/dataforseo_labs/)

### Implementation Options

You can either:
1. Add a new tool to an existing module
2. Create a completely new module

### Adding a New Tool

Here's how to add a new tool to any module (new or existing):

```typescript
// src/modules/your-module/tools/your-tool.tool.ts
import { BaseTool } from '../../base.tool';
import { DataForSEOClient } from '../../../client/dataforseo.client';
import { z } from 'zod';

export class YourTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    // DataForSEO API returns extensive data with many fields, which can be overwhelming
    // for AI agents to process. We select only the most relevant fields to ensure
    // efficient and focused responses.
    this.fields = [
      'title',           // Example: Include the title field
      'description',     // Example: Include the description field
      'url',            // Example: Include the URL field
      // Add more fields as needed
    ];
  }

  getName() {
    return 'your-tool-name';
  }

  getDescription() {
    return 'Description of what your tool does';
  }

  getParams(): z.ZodRawShape {
    return {
      // Required parameters
      keyword: z.string().describe('The keyword to search for'),
      location: z.string().describe('Location in format "City,Region,Country" or just "Country"'),
      
      // Optional parameters
      fields: z.array(z.string()).optional().describe('Specific fields to return in the response. If not specified, all fields will be returned'),
      language: z.string().optional().describe('Language code (e.g., "en")'),
    };
  }

  async handle(params: any) {
    try {
      // Make the API call
      const response = await this.client.makeRequest({
        endpoint: '/v3/dataforseo_endpoint_path',
        method: 'POST',
        body: [{
          // Your request parameters
          keyword: params.keyword,
          location: params.location,
          language: params.language,
        }],
      });

      // Validate the response for errors
      this.validateResponse(response);

      //if the main data array specified in tasks[0].result[:] field
      const result = this.handleDirectResult(response);
      //if main data array specified in tasks[0].result[0].items field
      const result = this.handleItemsResult(response);
      // Format and return the response
      return this.formatResponse(result);
    } catch (error) {
      // Handle and format any errors
      return this.formatErrorResponse(error);
    }
  }
}
```

### Creating a New Module

1. Create a new directory under `src/modules/` for your module:
```bash
mkdir -p src/modules/your-module-name
```

2. Create module files:
```typescript
// src/modules/your-module-name/your-module-name.module.ts
import { BaseModule } from '../base.module';
import { DataForSEOClient } from '../../client/dataforseo.client';
import { YourTool } from './tools/your-tool.tool';

export class YourModuleNameModule extends BaseModule {
  constructor(private client: DataForSEOClient) {
    super();
  }

  getTools() {
    return {
      'your-tool-name': new YourTool(this.client),
    };
  }
}
```

3. Register your module in `src/config/modules.config.ts`:
```typescript
export const AVAILABLE_MODULES = [
  'SERP',
  'KEYWORDS_DATA',
  'ONPAGE',
  'DATAFORSEO_LABS',
  'YOUR_MODULE_NAME'  // Add your module name here
] as const;
```

4. Initialize your module in `src/index.ts`:
```typescript
if (isModuleEnabled('YOUR_MODULE_NAME', enabledModules)) {
  modules.push(new YourModuleNameModule(dataForSEOClient));
}
```

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
