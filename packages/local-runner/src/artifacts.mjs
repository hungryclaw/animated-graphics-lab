import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dir) { await mkdir(dir, { recursive: true }); return dir; }
export async function writeJson(file, value) { await ensureDir(path.dirname(file)); await writeFile(file, JSON.stringify(value, null, 2) + '\n'); }
export async function readText(file) { return await readFile(file, 'utf8'); }
export async function writeText(file, value) { await ensureDir(path.dirname(file)); await writeFile(file, value); }
export async function copyIfExists(src, dst) { await ensureDir(path.dirname(dst)); await copyFile(src, dst); }

export function runPaths(outDir) {
  return {
    outDir,
    manifest: path.join(outDir, 'manifest.json'),
    inputArticle: path.join(outDir, 'article.input.md'),
    finalMarkdown: path.join(outDir, 'article.final.md'),
    finalHtml: path.join(outDir, 'article.final.html'),
    visuals: path.join(outDir, 'visuals')
  };
}

export function visualPaths(outDir, id) {
  const dir = path.join(outDir, 'visuals', id);
  return {
    dir,
    sourceHtml: path.join(dir, 'source.html'),
    indexHtml: path.join(dir, 'index.html'),
    metadata: path.join(dir, 'metadata.json'),
    previewPng: path.join(dir, 'preview.png'),
    mp4: path.join(dir, 'render.mp4'),
    gif: path.join(dir, 'render.gif')
  };
}
