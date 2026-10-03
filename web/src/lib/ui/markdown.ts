// Markdown with KaTeX math ($…$ inline, $$…$$ display) for lesson text.

import katex from 'katex';
import { marked } from 'marked';

export function renderMath(src: string, display = false): string {
  return katex.renderToString(src, {
    displayMode: display,
    throwOnError: false,
    strict: false,
    trust: (ctx) => ctx.command === '\\htmlClass',
  });
}

export function renderMarkdown(md: string): string {
  const math: string[] = [];
  const stash = (html: string) => `@@M${math.push(html) - 1}@@`;
  const withMath = md
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => stash(renderMath(m, true)))
    .replace(/\$([^$\n]+?)\$/g, (_, m) => stash(renderMath(m)));
  const html = marked.parse(withMath, { async: false }) as string;
  return html.replace(/@@M(\d+)@@/g, (_, i) => math[+i]);
}
