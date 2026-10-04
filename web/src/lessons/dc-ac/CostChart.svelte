<script lang="ts">
  // Cost against distance: AC starts cheap but grows fast; DC pays for its
  // converter stations up front, then grows slowly. They cross at the break-even.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { COST, type DcAcInfo } from '../../lib/models/module1b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 200, M = { l: 36, r: 10, t: 10, b: 24 };
  const dMax = 2000;
  const k = $derived(lab.info as DcAcInfo);
  const c = $derived(COST[lab.params.medium as 0 | 1]);
  const cMax = $derived(c.ac.terminal + c.ac.perKm * dMax);
  const X = (d: number) => M.l + ((W - M.l - M.r) * d) / dMax;
  const Y = (v: number) => H - M.b - ((H - M.t - M.b) * Math.min(v, cMax)) / cMax;
  const line = (t: number, per: number) => `M${X(0)},${Y(t)} L${X(dMax)},${Y(t + per * dMax)}`;
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Coût selon la distance', en: 'Cost versus distance' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Cost versus distance">
      {#each [0, 500, 1000, 1500, 2000] as d (d)}
        <line x1={X(d)} x2={X(d)} y1={M.t} y2={H - M.b} class="grid" />
        <text x={X(d)} y={H - 8} class="tick">{d} km</text>
      {/each}
      <path d={line(c.ac.terminal, c.ac.perKm)} class="ac" />
      <path d={line(c.dc.terminal, c.dc.perKm)} class="dc" />
      {#if k.breakEven < dMax}
        <circle cx={X(k.breakEven)} cy={Y(c.ac.terminal + c.ac.perKm * k.breakEven)} r="4.5" class="be" />
        <text x={X(k.breakEven) + 6} y={Y(c.ac.terminal + c.ac.perKm * k.breakEven) + 14} class="bel" text-anchor="start">{num(k.breakEven, 3)} km</text>
      {/if}
      <line x1={X(lab.params.km)} x2={X(lab.params.km)} y1={M.t} y2={H - M.b} class="cursor" />
      <text x={X(dMax) - 4} y={Y(c.ac.terminal + c.ac.perKm * dMax) + 12} class="lab ac-t" text-anchor="end">AC</text>
      <text x={X(dMax) - 4} y={Y(c.dc.terminal + c.dc.perKm * dMax) - 6} class="lab dc-t" text-anchor="end">DC</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 210px;
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
  .ac {
    stroke: var(--c-S);
    stroke-width: 2.4;
  }
  .dc {
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .be {
    fill: var(--accent);
  }
  .bel {
    fill: var(--accent);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .cursor {
    stroke: var(--ink);
    stroke-dasharray: 3 3;
  }
  .lab {
    font-size: 12px;
    font-weight: 700;
  }
  .ac-t {
    fill: var(--c-S);
  }
  .dc-t {
    fill: var(--c-C);
  }
</style>
