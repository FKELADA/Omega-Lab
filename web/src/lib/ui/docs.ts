// Renders documentation.md for the in-app documentation page: Markdown with math,
// GitHub-style heading anchors (so the document's own table of contents works),
// and links to sibling files sent to the repository on GitHub.

import { Marked } from 'marked';
import { renderMath } from './markdown';

export const REPO = 'https://github.com/FKELADA/Omega-Lab/blob/main/';

/** GitHub's anchor algorithm: lower-case, drop punctuation, spaces become hyphens. */
export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');

export interface DocHeading {
  id: string;
  text: string;
  depth: number;
}

export function renderDoc(md: string): { html: string; headings: DocHeading[] } {
  const headings: DocHeading[] = [];
  const math: string[] = [];
  const stash = (html: string) => `@@M${math.push(html) - 1}@@`;
  // Math first, so Markdown never sees (and mangles) the LaTeX.
  const src = md
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => stash(renderMath(m, true)))
    .replace(/\$([^$\n]+?)\$/g, (_, m) => stash(renderMath(m)));

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        const plain = text.replace(/@@M\d+@@/g, '');
        const id = slug(plain);
        headings.push({ id, text: plain.replace(/`/g, ''), depth });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
      },
      link({ href, tokens }) {
        const inner = this.parser.parseInline(tokens);
        if (href.startsWith('#')) return `<a href="${href}" data-anchor="${href.slice(1)}">${inner}</a>`;
        const url = /^https?:/.test(href) ? href : REPO + href;
        return `<a href="${url}" target="_blank" rel="noopener">${inner}</a>`;
      },
    },
  });
  const html = (marked.parse(src, { async: false }) as string).replace(/@@M(\d+)@@/g, (_, i) => math[+i]);
  return { html, headings };
}
