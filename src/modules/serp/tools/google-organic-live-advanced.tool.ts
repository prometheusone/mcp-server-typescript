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
      location_name: z.string().describe(`full name of the location
required field
Location format - hierarchical, comma-separated (from most specific to least)
 Can be one of:
 1. Country only: "United States"
 2. Region,Country: "California,United States"
 3. City,Region,Country: "San Francisco,California,United States"`),
      depth: z.number().min(10).max(700).default(10).describe(`parsing depth
optional field
number of results in SERP`),
      language_code: z.string().describe("search engine language code (e.g., 'en')"),
      keyword: z.string().describe("Search keyword"),
    };
  }

  async handle(params:any): Promise<any> {
    try {
      console.error(JSON.stringify(params, null, 2));
      const response = await this.dataForSEOClient.makeRequest('/v3/serp/google/organic/live/advanced', 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keyword: params.keyword,
        depth: params.depth,
      }]) as DataForSEOResponse;
      
      this.validateResponse(response);
      const filteredResults = this.handleItemsResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 