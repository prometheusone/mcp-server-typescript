import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../base.tool.js';
import { mapArrayToNumberedKeys } from '../../../utils/map-array-to-numbered-keys.js';

export class BacklinksPageIntersectionTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    this.fields = [
      "summary",
      "page_intersection",      
    ]
  }

  getName(): string {
    return 'backlinks_page_intersection_tool';
  }

  getDescription(): string {
    return "This endpoint will provide you with the list of domains pointing to the specified websites. This endpoint is especially useful for creating a Link Gap feature that shows what domains link to your competitors but do not link out to your website";
  }

  getParams(): z.ZodRawShape {
    return {
      targets: z.array(z.string()).describe(`domains, subdomains or webpages to get links for
required field
you can set up to 20 domains, subdomains or webpages
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      limit: z.number().min(1).max(1000).default(10).optional().describe("the maximum number of returned results"),
      offset: z.number().min(0).optional().describe(
        `offset in the array of returned results
optional field
default value: 0
if you specify the 10 value, the first ten backlinks in the results array will be omitted and the data will be provided for the successive backlinks`
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
["1.rank",">","80"]
[["2.page_from_rank",">","55"],
"and",
["1.original","=","true"]]

[["1.first_seen",">","2017-10-23 11:31:45 +00:00"],
"and",
[["1.acnhor","like","%seo%"],"or",["1.text_pre","not_like","%seo%"]]]
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
["rank,desc"]
note that you can set no more than three sorting rules in a single request
you should use a comma to separate several sorting rules
example:
["domain_from_rank,desc","page_from_rank,asc"]`
      ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/backlinks/page_intersection/live', 'POST', [{
        targets: mapArrayToNumberedKeys(params.targets),
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