<script lang="ts">
  // The component library: drag an element onto the bench (or tap it to drop it
  // in the middle of the view). Searchable, by family.
  import { FAMILIES, LIBRARY } from '../library';
  import { tr } from '../../lib/ui/ui.svelte';

  let { onadd }: { onadd: (type: string) => void } = $props();
  let q = $state('');
  const CIRCLE = new Set(['vdc', 'vac', 'vstep', 'vsquare', 'idc', 'voltmeter', 'ammeter']);
  const match = (name: { fr: string; en: string }) => !q || `${name.fr} ${name.en}`.toLowerCase().includes(q.toLowerCase());
</script>

<section class="panel lib">
  <header><span>{tr({ fr: 'Bibliothèque', en: 'Library' })}</span></header>
  <div class="body">
    <input class="search" type="search" placeholder={tr({ fr: 'Rechercher…', en: 'Search…' })} bind:value={q} />
    {#each FAMILIES as f (f.id)}
      {@const items = LIBRARY.filter((d) => d.family === f.id && match(d.name))}
      {#if items.length}
        <h4>{tr(f.name)}</h4>
        <div class="grid">
          {#each items as d (d.type)}
            <button
              class="item"
              draggable="true"
              title={tr(d.name)}
              ondragstart={(e) => e.dataTransfer?.setData('text/omega-el', d.type)}
              onclick={() => onadd(d.type)}
            >
              <svg viewBox="-44 -24 88 48" aria-hidden="true">
                {#if CIRCLE.has(d.type)}<circle r="14" class="body" />{/if}
                <path d={d.symbol} class="sym" />
                {#if d.glyph}<text y="5">{d.glyph}</text>{/if}
              </svg>
              <span>{tr(d.name)}</span>
            </button>
          {/each}
        </div>
      {/if}
    {/each}
    <p class="soon">
      {tr({
        fr: 'À venir : diodes et thyristors, transformateurs, lignes, machines, onduleurs, batteries, MMC (plan, §10).',
        en: 'Coming: diodes and thyristors, transformers, lines, machines, inverters, batteries, MMC (plan, §10).',
      })}
    </p>
  </div>
</section>

<style>
  .lib .body {
    overflow-y: auto;
  }
  .search {
    width: 100%;
    margin-bottom: 6px;
    padding: 4px 8px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel-2);
    color: var(--ink);
  }
  h4 {
    margin: 8px 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 6px;
  }
  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 2px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    cursor: grab;
    font-size: 10.5px;
    line-height: 1.15;
    color: var(--ink);
  }
  .item:hover {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  svg {
    width: 64px;
    height: 34px;
  }
  .sym {
    stroke: var(--ink);
    stroke-width: 2.4;
    fill: none;
  }
  .body {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 2.4;
  }
  text {
    font: 700 14px sans-serif;
    text-anchor: middle;
    fill: var(--ink);
  }
  .soon {
    margin: 10px 0 0;
    font-size: 11px;
    color: var(--muted);
  }
</style>
