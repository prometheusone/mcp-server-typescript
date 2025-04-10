import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';

export class GoogleAdsSearchVolumeTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
    this.fields = [
      'keyword',
      'search_volume',
      'cpc',
      'competition',
      'high_top_of_page_bid',
      'low_top_of_page_bid'
    ];
  }

  getName(): string {
    return 'keywords-google-ads-search-volume';
  }

  getDescription(): string {
    return 'Get search volume data for keywords from Google Ads';
  }

  getParams(): z.ZodRawShape {
    return {
      location_name: z.string().default("United States").describe(`full name of the location
        required field
        in format "Country"
        example:
        United Kingdom`),
              language_code: z.string().describe("Language code (e.g., 'en')"),
      keywords: z.array(z.string()).describe("Array of keywords to get search volume for"),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/google_ads/search_volume/live', 'POST', [{
        location_name: params.location_name,
        language_code: params.language_code,
        keywords: params.keywords,
      }]) as DataForSEOResponse;
      
      this.validateResponse(response);
      const filteredResults = this.handleDirectResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 