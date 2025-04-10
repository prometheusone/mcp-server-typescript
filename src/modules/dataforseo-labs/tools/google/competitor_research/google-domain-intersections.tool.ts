import { z } from 'zod';
import { DataForSEOClient } from '../../../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../../../base.tool.js';

export class GoogleDomainIntersectionsTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
    this.fields = [
      "keyword",
      "keyword_info.search_volume",
      "keyword_info.cpc",
      "keyword_info.competition",
      "keyword_info.low_top_of_page_bid",
      "keyword_info.high_top_of_page_bid",
      "keyword_properties.keyword_difficulty",
      "search_intent_info.main_intent",
      "first_domain_serp_element.type",
      "first_domain_serp_element.rank_absolute",
      "first_domain_serp_element.title",
      "first_domain_serp_element.url",
      "first_domain_serp_element.description",

      "second_domain_serp_element.type",
      "second_domain_serp_element.rank_absolute",
      "second_domain_serp_element.title",
      "second_domain_serp_element.url",
      "second_domain_serp_element.description",
    ]
  }

  getName(): string {
    return 'datalabs_google_domain_intersections';
  }

  getDescription(): string {
    return `This endpoint will provide you with the keywords for which both specified domains rank within the same SERP. You will get search volume, competition, cost-per-click and impressions data on each intersecting keyword. Along with that, you will get data on the first and second domain’s SERP element discovered for this keyword, as well as the estimated traffic volume and cost of ad traffic.`;
  }

  getParams(): z.ZodRawShape {
    return {
      target1: z.string().describe(`target domain 1`),
      target2: z.string().describe(`target domain 2 `),
      location_name: z.string().default("United States").describe(`full name of the location
required field
in format "Country"
example:
United Kingdom`),
      language_code: z.string().default("en").describe(
        `language code
        required field
        example:
        en`),
      ignore_synonyms: z.boolean().default(true).describe(
          `ignore highly similar keywords, if set to true, results will be more accurate`),
      limit: z.number().min(1).max(1000).default(100).optional().describe("Maximum number of keywords to return"),
      offset: z.number().min(0).optional().describe(
        `offset in the results array of returned keywords
        optional field
        default value: 0
        if you specify the 10 value, the first ten keywords in the results array will be omitted and the data will be provided for the successive keywords`
      ),
      filters: z.array(z.any()).optional().describe(
        `you can add several filters at once (8 filters maximum)
        you should set a logical operator and, or between the conditions
        the following operators are supported:
        regex, not_regex, <, <=, >, >=, =, <>, in, not_in, match, not_match, ilike, not_ilike, like, not_like
        you can use the % operator with like and not_like, as well as ilike and not_ilike to match any string of zero or more characters
        merge operator must be a string and connect two other arrays, availible values: or, and.
        example:
        ["keyword_data.keyword_info.search_volume","in",[100,1000]]
        [["first_domain_serp_element.etv",">",0],"and",["first_domain_serp_element.description","like","%goat%"]]

        [["keyword_data.keyword_info.search_volume",">",100],
        "and",
        [["first_domain_serp_element.description","like","%goat%"],
        "or",
        ["second_domain_serp_element.type","=","organic"]]]
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
        ["keyword_data.keyword_info.competition,desc"]
        default rule:
        ["keyword_data.keyword_info.search_volume,desc"]
        note that you can set no more than three sorting rules in a single request
        you should use a comma to separate several sorting rules
        example:
        ["keyword_data.keyword_info.search_volume,desc","keyword_data.keyword_info.cpc,desc"]`
          ),
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/dataforseo_labs/google/competitors_domain/live', 'POST', [{
        target1: params.target1,
        target2: params.target2,
        location_name: params.location_name,
        language_code: params.language_code,
        ignore_synonyms: params.ignore_synonyms,
        filters: params.filters,
        order_by: params.order_by,
        exclude_top_domains: params.exclude_top_domains,
        item_types: ['organic']
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