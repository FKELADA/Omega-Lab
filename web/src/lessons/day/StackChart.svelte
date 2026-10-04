<script lang="ts">
  // Generation stacked under the demand curve over 24 h. Flexible generation fills
  // the gap; where it would have to go negative (too much PV) or above its capacity,
  // the band turns orange.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FLEX_MAX } from '../../lib/models/module0';
  import { S, tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 320, H = 210, M = { l: 30, r: 8, t: 8, b: 22 };
  const s = $derived(lab.run.s);
  const n = $derived(lab.run.t.length);
  const yMax = 90;
  const X = (h: number) => M.l + ((W - M.l - M.r) * h) / 24;
  const Y = (gw: number) => M.t + (H - M.t - M.b) * (1 - Math.max(-10, gw) / yMax);
  const band = (lo: (k: number) => number, hi: (k: number) => number) => {
    let top = '', bot = '';
    for (let k = 0; k < n; k += 4) {
      top += `${k ? 'L' : 'M'}${X(lab.run.t[k]).toFixed(1)},${Y(hi(k)).toFixed(1)}`;
      bot = `L${X(lab.run.t[k]).toFixed(1)},${Y(lo(k)).toFixed(1)}` + bot;
    }
    return top + bot + 'Z';
  };
  const layers = $derived([
    { term: 'L', color: '--c-L', d: band(() => 0, (k) => s.base[k]) },
    { term: 'C', color: '--c-C', d: band((k) => s.base[k], (k) => s.base[k] + s.wind[k]) },
    { term: 'i', color: '--c-i', d: band((k) => s.base[k] + s.wind[k], (k) => s.base[k] + s.wind[k] + s.pv[k]) },
  ]);
  // Flexible generation within its capacity, then any shortfall above it.
  const flexBand = $derived(
    band(
      (k) => s.demand[k] - Math.max(0, s.flex[k]),
      (k) => s.demand[k] - Math.max(0, s.flex[k]) + Math.min(FLEX_MAX, Math.max(0, s.flex[k])),
    ),
  );
  const shortfall = $derived(band((k) => s.demand[k] - Math.max(0, s.flex[k] - FLEX_MAX), (k) => s.demand[k]));
  const surplus = $derived(band((k) => s.demand[k], (k) => s.demand[k] - Math.min(0, s.flex[k])));
  const demandLine = $derived(
    Array.from({ length: Math.ceil(n / 4) }, (_, j) => `${j ? 'L' : 'M'}${X(lab.run.t[j * 4]).toFixed(1)},${Y(s.demand[j * 4]).toFixed(1)}`).join(''),
  );
  const over = $derived(Math.max(...s.flex) > FLEX_MAX);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Équilibre sur 24 h', en: 'Balance over 24 h' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Generation stack">
      {#each [0, 20, 40, 60, 80] as g (g)}
        <line x1={M.l} x2={W - M.r} y1={Y(g)} y2={Y(g)} class="grid" />
        <text x={M.l - 4} y={Y(g) + 3} class="tick" text-anchor="end">{g}</text>
      {/each}
      {#each [0, 6, 12, 18, 24] as h (h)}
        <text x={X(h)} y={H - 6} class="tick">{h} h</text>
      {/each}
      {#each layers as l (l.term)}
        <path d={l.d} style="fill: var({l.color})" class="layer" data-term={l.term} />
      {/each}
      <path d={flexBand} class="layer flex" data-term="p" />
      {#if over}<path d={shortfall} class="layer short" />{/if}
      <path d={surplus} class="layer surplus" />
      <path d={demandLine} class="demand" />
      <line x1={X(lab.t)} x2={X(lab.t)} y1={M.t} y2={H - M.b} class="cursor" />
      <text x={M.l + 2} y={M.t + 10} class="tick" text-anchor="start">GW</text>
    </svg>
    <div class="legend">
      <span><i style="background: var(--c-L)"></i>{tr({ fr: 'nucléaire', en: 'nuclear' })}</span>
      <span><i style="background: var(--c-C)"></i>{tr({ fr: 'éolien', en: 'wind' })}</span>
      <span><i style="background: var(--c-i)"></i>PV</span>
      <span><i style="background: var(--c-p)"></i>{tr({ fr: 'flexible', en: 'flexible' })} (≤ {FLEX_MAX} GW)</span>
      <span><i style="background: var(--warn)"></i>{tr({ fr: 'excédent', en: 'surplus' })}</span>
      <span><i style="background: #c0392b"></i>{tr({ fr: 'manque', en: 'shortfall' })}</span>
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .layer {
    opacity: 0.55;
  }
  .flex {
    fill: var(--c-p);
  }
  .short {
    fill: #c0392b;
    opacity: 0.85;
  }
  .surplus {
    fill: var(--warn);
    opacity: 0.8;
  }
  .demand {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
  }
  .cursor {
    stroke: var(--accent);
    stroke-dasharray: 3 3;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
    font-size: 11px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    margin-right: 4px;
    vertical-align: -1px;
  }
</style>
