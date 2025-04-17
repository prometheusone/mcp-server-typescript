import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DataForSEOConfig } from './config.js';
import { DataForSEOClient } from './client/dataforseo.client.js';
import { SerpApiModule } from './modules/serp/serp-api.module.js';
import { KeywordsDataApi } from './modules/keywords-data/keywords-data-api.module.js';
import { OnPageApi } from './modules/onpage/onpage-api.module.js';
import { DataForSEOLabsApi } from './modules/dataforseo-labs/dataforseo-labs-api.module.js';
import { ModuleConfig, ModuleConfigSchema, defaultModuleConfig } from './config/modules.config.js';
import { BaseModule } from './modules/base.module.js';
import { z } from 'zod';

interface ToolDefinition {
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
}

console.error('Starting DataForSEO MCP Server...');

// Create server instance
const server = new McpServer({
  name: "dataforseo",
  version: "1.0.0",
});

// Initialize DataForSEO client
const dataForSEOConfig: DataForSEOConfig = {
  username: process.env.DATAFORSEO_USERNAME || "",
  password: process.env.DATAFORSEO_PASSWORD || "",
};

const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
console.error('DataForSEO client initialized');

// Parse module configuration from environment
const moduleConfig: ModuleConfig = ModuleConfigSchema.parse({
  serp: process.env.ENABLE_SERP_API !== 'false',
  keywords: process.env.ENABLE_KEYWORDS_API !== 'false',
  onpage: process.env.ENABLE_ONPAGE_API !== 'false',
  dataforseo_labs: process.env.ENABLE_DATAFORSEO_LABS_API !== 'false',
});

// Initialize modules
const modules: BaseModule[] = [];

if (moduleConfig.serp) {
  modules.push(new SerpApiModule(dataForSEOClient));
}

if (moduleConfig.keywords) {
  modules.push(new KeywordsDataApi(dataForSEOClient));
}

if (moduleConfig.onpage) {
  modules.push(new OnPageApi(dataForSEOClient));
}

if (moduleConfig.dataforseo_labs) {
  modules.push(new DataForSEOLabsApi(dataForSEOClient));
}
console.error('Modules initialized');

// Register tools from modules
function registerModuleTools() {
  modules.forEach(module => {
    const tools = module.getTools();
    Object.entries(tools).forEach(([name, tool]) => {
      const typedTool = tool as ToolDefinition;
      const schema = z.object(typedTool.params);
      server.tool(
        name,
        typedTool.description,
        schema.shape,
        typedTool.handler
      );
    });
  });
}

// Register all tools
registerModuleTools();
console.error('Tools registered');

// Start the server
async function main() {
  const transport = new StdioServerTransport(); 
  console.error('Starting server');
  await server.connect(transport);
  console.error("DataForSEO MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
