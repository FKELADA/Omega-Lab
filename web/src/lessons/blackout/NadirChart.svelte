<script lang="ts">
  // Frequency nadir against system inertia, with every other setting as chosen.
  // Each point is a full simulation, so the cliff where protection starts to
  // cascade shows up as a jump.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { SYS, blackoutInfo } from '../../lib/models/module0';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 200, M = { l: 40, r: 10, t: 10, b: 24 };
  const Hs = Array.from({ length: 14 }, (_, j) => 1.5 + j * 0.5);
  const pts = $derived(Hs.map((h) => ({ h, ...blackoutInfo({ ...lab.params, H: h }) })));
  const lo = 48, hi = 50;
  const X = (h: number) => M.l + ((W - M.l - M.r) * (h - 1.5)) / 6.5;
  const Y = (f: number) => M.t + ((H - M.t - M.b) * (hi - Math.max(lo, f))) / (hi - lo);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Creux de fréquence selon l’inertie', en: 'Nadir versus inertia' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Nadir versus inertia">
      <rect x={M.l} y={Y(SYS.lfdd)} width={W - M.l - M.r} height={Y(lo) - Y(SYS.lfdd)} class="danger" />
      {#each [48, 48.5, 49, 49.5, 50] as f (f)}
        <line x1={M.l} x2={W - M.r} y1={Y(f)} y2={Y(f)} class="grid" />
        <text x={M.l - 4} y={Y(f) + 3} class="tick" text-anchor="end">{num(f, 3)}</text>
      {/each}
      {#each [2, 4, 6, 8] as h (h)}
        <text x={X(h)} y={H - 8} class="tick">H = {h} s</text>
      {/each}
      <polyline points={pts.map((p) => `${X(p.h)},${Y(p.nadir)}`).join(' ')} class="curve" />
      {#each pts as p (p.h)}
        <circle cx={X(p.h)} cy={Y(p.nadir)} r="3" class="pt" class:shed={p.shed} />
      {/each}
      <line x1={X(lab.params.H)} x2={X(lab.params.H)} y1={M.t} y2={H - M.b} class="cursor" />
    </svg>
    <div class="legend">
      <span><i class="dot"></i>{tr({ fr: 'sans délestage', en: 'no shedding' })}</span>
      <span><i class="dot shed"></i>{tr({ fr: 'avec délestage', en: 'with shedding' })}</span>
    </div>
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
  .danger {
    fill: var(--warn-soft);
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .curve {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2;
  }
  .pt {
    fill: var(--c-p);
  }
  .pt.shed {
    fill: var(--warn);
  }
  .cursor {
    stroke: var(--accent);
    stroke-dasharray: 3 3;
  }
  .legend {
    display: flex;
    gap: 12px;
    font-size: 11.5px;
    color: var(--muted);
  }
  .dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c-p);
    margin-right: 4px;
  }
  .dot.shed {
    background: var(--warn);
  }
</style>
