#!/usr/bin/env node
// Regenerates the auto-indexed block of obsidian-vault/dnd-rules/INDEX.md
// after Claude writes/edits any markdown file in that folder.
//
// Triggered by a PostToolUse hook on Write|Edit|MultiEdit. Reads the tool
// event from stdin to check whether the write actually targeted the rules
// folder; if not, exits silently. INDEX.md itself is excluded so the hook
// never recurses.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RULES_DIR = path.resolve(ROOT, 'obsidian-vault/dnd-rules');
const INDEX_FILE = path.join(RULES_DIR, 'INDEX.md');
const START = '<!-- AUTO-INDEX:START -->';
const END = '<!-- AUTO-INDEX:END -->';

let stdin = '';
try { stdin = fs.readFileSync(0, 'utf8'); } catch {}

let touchedPath = null;
try {
  const evt = JSON.parse(stdin);
  touchedPath =
    evt?.tool_input?.file_path ||
    evt?.tool_input?.path ||
    evt?.tool_response?.filePath ||
    null;
} catch {}

if (touchedPath) {
  const normalized = path.resolve(touchedPath);
  const inRulesFolder = normalized.toLowerCase().startsWith(RULES_DIR.toLowerCase() + path.sep);
  const isIndex = path.basename(normalized).toLowerCase() === 'index.md';
  if (!inRulesFolder || isIndex) process.exit(0);
}

if (!fs.existsSync(RULES_DIR)) process.exit(0);

const files = fs.readdirSync(RULES_DIR)
  .filter(f => f.toLowerCase().endsWith('.md') && f.toLowerCase() !== 'index.md')
  .sort((a, b) => a.localeCompare(b));

const rows = files.map(f => {
  const text = fs.readFileSync(path.join(RULES_DIR, f), 'utf8');
  const lines = text.split(/\r?\n/);
  const headingLine = lines.find(l => /^#\s+\S/.test(l));
  const summaryLine = lines.find(l => /^>\s+\S/.test(l));
  const heading = headingLine ? headingLine.replace(/^#\s+/, '').trim() : f.replace(/\.md$/i, '');
  const summary = summaryLine ? summaryLine.replace(/^>\s*/, '').trim() : '(no summary)';
  return `- [${f}](${f}) — **${heading}** — ${summary}`;
});

const block = `${START}\n${rows.length ? rows.join('\n') : '_(no topic files yet)_'}\n${END}`;

let existing = fs.existsSync(INDEX_FILE) ? fs.readFileSync(INDEX_FILE, 'utf8') : '';
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blockRe = new RegExp(`${reEsc(START)}[\\s\\S]*?${reEsc(END)}`);

const updated = blockRe.test(existing)
  ? existing.replace(blockRe, block)
  : (existing.trimEnd() + (existing ? '\n\n' : '') + block + '\n');

if (updated !== existing) {
  fs.writeFileSync(INDEX_FILE, updated);
}
