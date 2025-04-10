import { z } from 'zod';
import { DataForSEOClient } from '../client/dataforseo.client.js';
import { filterFields, parseFieldPaths } from '../utils/field-filter.js';

export interface DataForSEOResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: Record<string, any>;
    result: any[];
  }>;
}

export abstract class BaseTool {
  protected dataForSEOClient: DataForSEOClient;
  protected fields: string[] = [];

  constructor(dataForSEOClient: DataForSEOClient) {
    this.dataForSEOClient = dataForSEOClient;
  }

  protected formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  protected formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  protected formatErrorResponse(error: unknown): { content: Array<{ type: string; text: string }> } {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${this.formatError(error)}`,
        },
      ],
    };
  }

  protected validateResponse(response: DataForSEOResponse): void {
    if (response.status_code / 100 !== 200) {
      throw new Error(`API Error: ${response.status_message} (Code: ${response.status_code})`);
    }

    if (response.tasks_error > 0) {
      throw new Error(`Tasks Error: ${response.tasks_error} tasks failed`);
    }

    if (response.tasks.length === 0) {
      throw new Error('No tasks in response');
    }

    const task = response.tasks[0];
    if (task.status_code / 100 !== 200) {
      throw new Error(`Task Error: ${task.status_message} (Code: ${task.status_code})`);
    }
  }

  protected handleItemsResult(result: any[]): any[] {
    if (!result[0]?.items) {
      return this.filterResponseFields(result,this.fields);
    }
    if(this.fields.length === 0) {
      return result[0].items;
    }
    return result[0].items.map((item: any) => {
      return this.filterResponseFields(item,this.fields);
    });
  }

  protected handleDirectResult(result: any[]): any[] {    
    return result.map((item: any)=> {
      return this.filterResponseFields(item,this.fields);
    })
  }

  private filterFields(data: any[]): any[] {
    if (this.fields.length === 0) {
      return data;
    }
    return data.map(item => {
      const filteredItem: any = {};
      this.fields.forEach(field => {
        if (field in item) {
          filteredItem[field] = item[field];
        }
      });
      return filteredItem;
    });
  }

  abstract getName(): string;
  abstract getDescription(): string;
  abstract getParams(): z.ZodRawShape;
  abstract handle(params: any): Promise<any>;

  protected filterResponseFields(response: any, fields: string[]): any {
    if (!fields || fields.length === 0) {
      return response;
    }

    const fieldPaths = parseFieldPaths(fields);
    return filterFields(response, fieldPaths);
  }
} 