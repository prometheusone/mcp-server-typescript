import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../base.tool.js';

export class BacklinksReferringDomainsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    this.fields = [
      "domain", 
      "rank",      
      "backlinks",
      "backlinks_spam_score",
      "broken_backlinks",
      "broken_pages",
      "referring_domains",
      "referring_pages",
      "referring_links_tld",
      "referring_links_attributes",
      "referring_links_platform_types",
      "referring_links_semantic_locations",
      "referring_links_countries"
    ]
  }

  getName(): string {
    return 'backlinks_referring_domains_tool';
  }

  getDescription(): string {
    return "This endpoint will provide you with a detailed overview of referring domains pointing to the target you specify";
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`domain, subdomain or webpage to get backlinks for
        required field
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("the maximum number of returned pages"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned pages
optional field
default value: 0
if you specify the 10 value, the first ten pages in the results array will be omitted and the data will be provided for the successive pages`
      ),
      filters: z.array(z.any()).optional().describe(
        `array of results filtering parameters
optional field
you can add several filters at once (8 filters maximum)
you should set a logical operator and, or between the conditions
the following operators are supported:
regex, not_regex, =, <>, in, not_in, like, not_like, ilike, not_ilike, match, not_match
you can use the % operator with like and not_like to match any string of zero or more characters
example:
["meta.internal_links_count",">","1"]
[["meta.external_links_count",">","2"],
"and",
["backlinks",">","10"]]

[["first_visited",">","2017-10-23 11:31:45 +00:00"],
"and",
[["title","like","%seo%"],"or",["referring_domains",">","10"]]]
        availiable fields for filter:
        ${this.fields.join("\n")}`
      ),
      order_by: z.array(z.string()).optional().describe(
        `results sorting rules
optional field
you can use the same values as in the filters array to sort the results
possible sorting types:
asc – results will be sorted in the ascending order
desc – results will be sorted in the descending order
you should use a comma to set up a sorting type
example:
["page_summary.backlinks,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["page_summary.backlinks,desc","page_summary.rank,asc"]`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/backlinks/referring_domains/live', 'POST', [{
        target: params.target,
        limit: params.limit,
        offset: params.offset,
        filters: params.filters,
        order_by: params.order_by
      }]) as DataForSEOResponse;
      console.error(JSON.stringify(response));
      this.validateResponse(response);
      const filteredResults = this.handleItemsResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 