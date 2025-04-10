import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';

export class GoogleOrganicLiveAdvancedTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
    this.fields = [
      'rank_group',
      'rank_absolute',
      'type',
      'domain',
      'title',
      'url',
      'description'
    ];
  }

  getName(): string {
    return 'serp-google-organic-live-advanced';
  }

  getDescription(): string {
    return 'Get Google organic search results for a keyword';
  }

  getParams(): z.ZodRawShape {
    return {
      location_code: z.number().describe("Location code for the search"),
      language_code: z.string().describe("Language code (e.g., 'en')"),
      keyword: z.string().describe("Search keyword"),
    };
  }

  async handle(params: { location_code: number; language_code: string; keyword: string }): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/serp/google/organic/live/advanced', 'POST', [{
        location_code: params.location_code,
        language_code: params.language_code,
        keyword: params.keyword,
      }]) as DataForSEOResponse;
      
      this.validateResponse(response);
      const filteredResults = this.handleItemsResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 