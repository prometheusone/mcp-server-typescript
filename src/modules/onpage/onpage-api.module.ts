import { BaseModule } from '../base.module.js';
import { ContentParsingTool } from './tools/content-parsing.tool.js';
import { DataForSEOClient } from '../../client/dataforseo.client.js';
import { z } from 'zod';
import { InstantPagesTool } from './tools/instant-pages.tool.js';

interface ToolDefinition {
  description: string;
  params: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
}

export class OnPageApi extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new ContentParsingTool(this.dataForSEOClient),
      new InstantPagesTool(this.dataForSEOClient),
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