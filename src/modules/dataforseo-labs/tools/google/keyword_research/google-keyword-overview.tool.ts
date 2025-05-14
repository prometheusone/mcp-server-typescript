import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../../../base.tool.js';

export class GoogleKeywordOverviewTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    this.fields = [
      "keyword",
      "keyword_info.search_volume",
      "keyword_info.cpc",
      "keyword_info.competition",
      "keyword_info.low_top_of_page_bid",
      "keyword_info.high_top_of_page_bid",
      "keyword_info.monthly_searches",
      "keyword_properties.keyword_difficulty",
      "search_intent_info.main_intent"    
    ]
  }

  getName(): string {
    return 'datalabs_google_keyword_overview';
  }

  getDescription(): string {
    return `This endpoint provides Google keyword data for specified keywords. For each keyword, you will receive current cost-per-click, competition values for paid search, search volume, search intent, monthly searches`;
  }

  getParams(): z.ZodRawShape {
    return {
      keywords: z.array(z.string()).describe(`keywords
required field
The maximum number of keywords you can specify: 700
The maximum number of characters for each keyword: 80
The maximum number of words for each keyword phrase: 10
the specified keywords will be converted to lowercase format, data will be provided in a separate array
note that if some of the keywords specified in this array are omitted in the results you receive, then our database doesn’t contain such keywords and cannot return data on them
you will not be charged for the keywords omitted in the results`),
      location_name: z.string().default("United States").describe(`full name of the location
required field
in format "Country"
example:
United Kingdom`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        example:
        en`)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/keyword_overview/live', 'POST', [{
        keywords: params.keywords,
        location_name: params.location_name,
        language_code: params.language_code
      }]) as DataForSEOResponse;
      console.error(JSON.stringify(response));
      this.validateResponse(response);
      const filteredResults = this.handleItemsResult(response.tasks[0].result);
      console.error('FILTERED');
      console.error(JSON.stringify(filteredResults));
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 