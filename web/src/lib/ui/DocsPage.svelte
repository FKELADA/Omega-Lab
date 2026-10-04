<script lang="ts">
  // The project documentation (documentation.md), rendered in the app with a
  // sticky table of contents. In-page anchors scroll without touching the URL
  // hash, which the app uses for lesson routing.
  import doc from '../../../../documentation.md?raw';
  import { renderDoc } from './docs';
  import { tr } from './ui.svelte';

  let { onback }: { onback: () => void } = $props();

  const { html, headings } = renderDoc(doc);
  const toc = headings.filter((h) => h.depth === 2 || h.depth === 3);
  let article: HTMLElement;
  let active = $state('');

  function go(id: string) {
    const el = article.querySelector(`#${CSS.escape(id)}`);
    el?.scrollIntoView({ block: 'start' });
    active = id;
  }

  function onclick(e: MouseEvent) {
    const a = (e.target as Element).closest('a[data-anchor]');
    if (!a) return;
    e.preventDefault();
    go(a.getAttribute('data-anchor')!);
  }
</script>

<div class="docs">
  <aside class="toc">
    <button class="btn back" onclick={onback}>← {tr({ fr: 'Retour aux leçons', en: 'Back to the lessons' })}</button>
    <nav aria-label="Contents">
      {#each toc as h (h.id)}
        <a
          href="#{h.id}"
          class:sub={h.depth === 3}
          class:active={active === h.id}
          onclick={(e) => {
            e.preventDefault();
            go(h.id);
          }}>{h.text.split(' · ')[0]}</a
        >
      {/each}
    </nav>
  </aside>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <article bind:this={article} {onclick}>
    {#if !doc}<p>…</p>{/if}
    <div class="lang-note">
      {tr({
        fr: 'Documentation technique (en anglais) : objectifs, formules, modèles, paramètres, étapes guidées et tests de chaque leçon. Pour une présentation simple, utilisez les notes pédagogiques ⓘ du parcours.',
        en: 'Technical documentation: objectives, formulas, models, parameters, guided steps and tests for every lesson. For a simple overview, use the ⓘ teaching notes in the course map.',
      })}
    </div>
    {@html html}
  </article>
</div>

<style>
  .docs {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 20px;
    padding: 16px;
    min-height: 0;
    overflow-y: auto;
  }
  .toc {
    position: sticky;
    top: 12px;
    align-self: start;
    max-height: calc(100vh - 100px);
    overflow-y: auto;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
  }
  .back {
    width: 100%;
    justify-content: center;
    margin-bottom: 8px;
  }
  nav a {
    display: block;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--ink);
    text-decoration: none;
  }
  nav a.sub {
    padding-left: 22px;
    font-size: 12.5px;
    color: var(--muted);
  }
  nav a:hover,
  nav a.active {
    background: var(--accent-soft);
    color: var(--ink);
  }
  article {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 18px 28px 40px;
    min-width: 0;
    line-height: 1.6;
  }
  .lang-note {
    background: var(--accent-soft);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    margin-bottom: 8px;
  }
  article :global(h1) {
    font-size: 26px;
  }
  article :global(h2) {
    font-size: 21px;
    margin-top: 32px;
    padding-top: 8px;
    border-top: 1px solid var(--line);
    scroll-margin-top: 12px;
  }
  article :global(h3) {
    font-size: 17px;
    margin-top: 26px;
    scroll-margin-top: 12px;
  }
  article :global(table) {
    border-collapse: collapse;
    width: 100%;
    font-size: 13px;
    margin: 8px 0;
    display: block;
    overflow-x: auto;
  }
  article :global(th),
  article :global(td) {
    border: 1px solid var(--line);
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
  }
  article :global(th) {
    background: var(--panel-2);
  }
  article :global(code) {
    font-family: var(--mono);
    font-size: 12.5px;
    background: var(--panel-2);
    padding: 1px 4px;
    border-radius: 4px;
  }
  article :global(blockquote) {
    border-left: 3px solid var(--accent);
    margin: 8px 0;
    padding: 2px 12px;
    color: var(--muted);
  }
  article :global(a) {
    color: var(--accent);
  }
  article :global(.katex-display) {
    overflow-x: auto;
  }
  @media (max-width: 860px) {
    .docs {
      grid-template-columns: minmax(0, 1fr);
      padding: 12px;
    }
    .toc {
      position: static;
      max-height: 240px;
    }
    article {
      padding: 14px 16px 30px;
    }
  }
</style>
