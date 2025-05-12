import { z } from 'zod';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { BaseTool, DataForSEOResponse } from '../../base.tool.js';

export class BacklinksSummaryTool extends BaseTool {
  constructor(private client: DataForSEOClient) {
    super(client);
  }

  getName(): string {
    return 'backlinks_summary_tool';
  }

  getDescription(): string {
    return "This endpoint will provide you with an overview of backlinks data available for a given domain, subdomain, or webpage";
  }

  getParams(): z.ZodRawShape {
    return {
      target: z.string().describe(`domain, subdomain or webpage to get backlinks for
        required field
a domain or a subdomain should be specified without https:// and www.
a page should be specified with absolute URL (including http:// or https://)`),
      include_subdomains: z.boolean().optional().describe(`indicates if indirect links to the target will be included in the results
if set to true, the results will include data on indirect links pointing to a page that either redirects to the target, or points to a canonical page
if set to false, indirect links will be ignored`).default(true),
      exclude_internal_backlinks: z.boolean().optional().describe(`indicates if internal backlinks from subdomains to the target will be excluded from the results
if set to true, the results will not include data on internal backlinks from subdomains of the same domain as target
if set to false, internal links will be included in the results`).default(true)
    };
  }

  async handle(params: any): Promise<any> {
    try {
      const response = await this.client.makeRequest('/v3/backlinks/summary/live', 'POST', [{
        target: params.target,
        limit: params.limit,
        offset: params.offset,
        filters: params.filters,
        order_by: params.order_by,
        main_domain: params.main_domain,
        exclude_large_domains: params.exclude_large_domains,
        exclude_internal_backlinks: params.exclude_internal_backlinks
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