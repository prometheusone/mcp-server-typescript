import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';

export class SerpOrganicLocationsListTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
    this.fields = [
      'location_name'
    ];
  }

  getName(): string {
    return 'serp-organic-locations-list';
  }

  getDescription(): string {
    return 'Utility tool for serp-organic-live-advanced to get list of availible locations';
  }

  getParams(): z.ZodRawShape {
    return {
      search_engine: z.string().default('google').describe("search engine name, one of: google, yahoo, bing."),
      country_code: z.string().default('US').describe("country code (e.g., 'US')"),
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest(`/v3/serp/${params.search_engine}/locations/${params.country_code}`, 'GET') as DataForSEOResponse;
      
      this.validateResponse(response);
      const filteredResults = this.handleDirectResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 