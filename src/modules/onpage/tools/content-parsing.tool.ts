import { z } from 'zod';
import { BaseTool } from '../../base.tool.js';
import { DataForSEOClient } from '../../../client/dataforseo.client.js';
import { DataForSEOResponse } from '../../base.tool.js';

export class ContentParsingTool extends BaseTool {
  constructor(dataForSEOClient: DataForSEOClient) {
    super(dataForSEOClient);
    this.fields = [
      'page_content'
    ];
  }

  getName(): string {
    return 'onpage-content-parsing';
  }

  getDescription(): string {
    return 'This endpoint allows parsing the content on any page you specify and will return the structured content of the target page, including link URLs, anchors, headings, and textual content.';
  }

  getParams(): z.ZodRawShape {
    return {
      url: z.string().describe("URL of the page to parse"),
      enable_javascript: z.boolean().optional().describe("Enable JavaScript rendering"),
      custom_js: z.string().optional().describe("Custom JavaScript code to execute"),
      custom_user_agent: z.string().optional().describe("Custom User-Agent header"),
      accept_language: z.string().optional().describe("Accept-Language header value"),
    };
  }

  async handle(params: { 
    url: string; 
    enable_javascript?: boolean; 
    custom_js?: string; 
    custom_user_agent?: string; 
    accept_language?: string; 
  }): Promise<any> {
    try {
      const response = await this.dataForSEOClient.makeRequest('/v3/on_page/content_parsing/live', 'POST', [{
        url: params.url,
        enable_javascript: params.enable_javascript,
        custom_js: params.custom_js,
        custom_user_agent: params.custom_user_agent,
        accept_language: params.accept_language,
      }]) as DataForSEOResponse;
      this.validateResponse(response);
      const filteredResults = this.handleItemsResult(response.tasks[0].result);
      return this.formatResponse(filteredResults);
    } catch (error) {
      return this.formatErrorResponse(error);
    }
  }
} 