import { BaseModule } from '../base.module.js';
import { z } from 'zod';
import { SerpOrganicLiveAdvancedTool } from './tools/serp-organic-live-advanced.tool.js';
import { SerpOrganicLocationsListTool } from './tools/serp-organic-locations-list.tool.js';
interface ToolDefinition {
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
}

export class SerpApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new SerpOrganicLiveAdvancedTool(this.dataForSEOClient),
      new SerpOrganicLocationsListTool(this.dataForSEOClient),
      // Add more tools here
    ];

    return tools.reduce((acc, tool) => ({
      ...acc,
      [tool.getName()]: {
        description: tool.getDescription(),
        params: tool.getParams(),
        handler: (params: any) => tool.handle(params),
      },
    }), {});
  }
} 