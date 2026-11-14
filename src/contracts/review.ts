import { z } from 'zod';
export const categories = [
  'contradiction',
  'competition',
  'characteristics',
  'classification',
  'warranty',
  'standards',
  'completeness',
] as const;
export const categoryLabels: Record<Category, string> = {
  contradiction: 'Противоречия',
  competition: 'Конкуренция',
  characteristics: 'Характеристики',
  classification: 'Коды ОКПД 2',
  warranty: 'Гарантии',
  standards: 'Нормативы',
  completeness: 'Комплектность',
};
export type Category = (typeof categories)[number];
export type Block = {
  id: string;
  text: string;
  location: string;
  kind: 'paragraph' | 'table';
  section: string;
};
export type Document = { name: string; blocks: Block[]; characters: number };
export const findingSchema = z.object({
  title: z.string().min(5).max(180),
  category: z.enum(categories),
  severity: z.enum(['high', 'medium', 'low']),
  confidence: z.enum(['confirmed', 'review']),
  blockId: z.string(),
  quote: z.string().min(2).max(1800),
  relatedBlockIds: z.array(z.string()).max(12).default([]),
  explanation: z.string().min(10).max(3500),
  recommendation: z.string().min(10).max(3500),
  sourceIds: z.array(z.string()).max(5).default([]),
});
export type Finding = z.infer<typeof findingSchema> & { id: string; origin: 'local' | 'model' };
export type Review = {
  id: string;
  name: string;
  createdAt: string;
  document: Document;
  findings: Finding[];
  engine: 'local' | 'hybrid';
  warnings: string[];
  durationMs: number;
  decisions: Record<string, 'accepted' | 'dismissed'>;
};
