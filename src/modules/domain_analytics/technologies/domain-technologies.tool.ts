import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../base.tool.js';

export class DomainTechnologiesTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'domain_technologies_tool';
  }

  getDescription(): string {
    return `Using this endpoint you will get a list of technologies used in a particular domain`;
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`target domain
required field
domain name of the website to analyze
Note: results will be returned for the specified domain only`)      
      }
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/domain_analytics/technologies/domain_technologies/live', 'POST', [{
        target: params.target
      }]) as DataForSEOResponse;
      console.error(JSON.stringify(response));
      this.validateResponse(response);
      const filteredResults = this.handleDirectResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 