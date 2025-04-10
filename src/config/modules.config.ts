import { z } from 'zod';

export const ModuleConfigSchema = z.object({
  serp: z.boolean().default(true).describe("Enable SERP API module"),
  keywords: z.boolean().default(true).describe("Enable Keywords Data API module"),
  onpage: z.boolean().default(true).describe("Enable OnPage API module"),
  dataforseo_labs: z.boolean().default(true),
});

export type ModuleConfig = z.infer<typeof ModuleConfigSchema>;

export const defaultModuleConfig: ModuleConfig = {
  serp: true,
  keywords: true,
  onpage: true,
  dataforseo_labs: true,
}; 