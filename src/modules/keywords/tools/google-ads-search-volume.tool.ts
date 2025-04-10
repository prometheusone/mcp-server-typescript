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
      'categories',
      'monthly_searches',
      'yearly_searches',
      'difficulty',
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
      location_code: z.number().describe("Location code for the search"),
      language_code: z.string().describe("Language code (e.g., 'en')"),
      keywords: z.array(z.string()).describe("Array of keywords to get search volume for"),
    };
  }

  async handle(params: { location_code: number; language_code: string; keywords: string[] }): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/keywords_data/google_ads/search_volume/live', 'POST', [{
        location_code: params.location_code,
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