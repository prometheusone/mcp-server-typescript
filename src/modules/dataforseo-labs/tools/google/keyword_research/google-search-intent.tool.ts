import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../../../base.tool.js';

export class GoogleSearchIntentTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    this.fields = [
      "keyword",
      "keyword_intent",
      "secondary_keyword_intents"
    ]
  }

  getName(): string {
    return 'datalabs_search_intent';
  }

  getDescription(): string {
    return `This endpoint will provide you with search intent data for up to 1,000 keywords. For each keyword that you specify when setting a task, the API will return the keyword’s search intent and intent probability. Besides the highest probable search intent, the results will also provide you with other likely search intent(s) and their probability.
Based on keyword data and search results data, our system has been trained to detect four types of search intent: informational, navigational, commercial, transactional.`;
  }

  getParams(): z.ZodRawShape {
    return {
      keywords: z.array(z.string()).describe(`target keywords
required field
UTF-8 encoding
maximum number of keywords you can specify in this array: 1000`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        Note: this endpoint currently supports the following languages only:
ar,
zh-TW,
cs,
da,
nl,
en,
fi,
fr,
de,
he,
hi,
it,
ja,
ko,
ms,
nb,
pl,
pt,
ro,
ru,
es,
sv,
th,
uk,
vi,
bg,
hr,
sr,
sl,
bs`),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/search_intent/live', 'POST', [{
        keywords: params.keywords,
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