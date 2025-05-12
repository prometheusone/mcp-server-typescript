import { BaseModule, ToolDefinition } from '../base.module.js';
import { DomainTechnologiesTool } from './technologies/domain-technologies.tool.js';
import { WhoisOverviewTool } from './whois/whois-overview.tool.js';

export class DomainAnalyticsApiModule extends BaseModule {
  getTools(): Record<string, ToolDefinition> {
    const tools = [
      new WhoisOverviewTool(this.dataForSEOClient),
      new DomainTechnologiesTool(this.dataForSEOClient),
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