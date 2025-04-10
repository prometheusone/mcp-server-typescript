import { BaseModule } from '../base.module.js';
import { GoogleAdsSearchVolumeTool } from './tools/google-ads-search-volume.tool.js';
import { DataForSEOClient } from '../../client/dataforseo.client.js';
import { z } from 'zod';

interface ToolDefinition {
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
}

export class KeywordsDataApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new GoogleAdsSearchVolumeTool(this.dataForSEOClient),
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