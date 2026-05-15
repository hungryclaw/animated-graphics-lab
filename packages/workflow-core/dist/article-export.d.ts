export declare function splitArticleParagraphs(articleText: string): string[];
import type { ExportSpot } from './types.js';
export declare function buildArticleHtml(articleText: string, spots: ExportSpot[], title?: string): string;
export declare function buildArticleMarkdown(articleText: string, spots: ExportSpot[]): string;
export declare function articleBaseName(title: string): string;
