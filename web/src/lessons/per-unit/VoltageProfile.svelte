<script lang="ts">
  // Voltage magnitude along the feeder, in pu, against the usual ±5 % band.
  // Three voltage levels on one axis: that is the point of per-unit.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { busVoltages, type PerUnitInfo } from '../../lib/models/module2b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 200, M = { l: 40, r: 14, t: 14, b: 30 };
  const k = $derived(lab.info as PerUnitInfo);
  const v = $derived(busVoltages(k).map(cabs));
  const lo = $derived(Math.min(0.8, ...v) - 0.02);
  const hi = $derived(Math.max(1.1, ...v) + 0.02);
  const X = (j: number) => M.l + ((W - M.l - M.r) * j) / 3;
  const Y = (x: number) => M.t + ((H - M.t - M.b) * (hi - x)) / (hi - lo);
  const names = ['G', 'T1', { fr: 'Ligne', en: 'Line' }, { fr: 'Charge', en: 'Load' }];
  const ticks = $derived([0.8, 0.9, 1, 1.1].filter((t) => t >= lo && t <= hi));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Profil de tension', en: 'Voltage profile' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Voltage profile">
      <rect x={M.l} y={Y(1.05)} width={W - M.l - M.r} height={Y(0.95) - Y(1.05)} class="band" />
      {#each ticks as t (t)}
        <line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} class="grid" />
        <text x={M.l - 6} y={Y(t) + 4} class="tick" text-anchor="end">{num(t, 2)}</text>
      {/each}
      <polyline points={v.map((x, j) => `${X(j)},${Y(x)}`).join(' ')} class="prof" />
      {#each v as x, j (j)}
        <circle cx={X(j)} cy={Y(x)} r="4.5" class="pt" class:bad={Math.abs(x - 1) > 0.05} />
        <text x={X(j)} y={Y(x) - 9} class="val">{num(x, 3)}</text>
        <text x={X(j)} y={H - 10} class="tick">{typeof names[j] === 'string' ? names[j] : tr(names[j] as { fr: string; en: string })}</text>
      {/each}
    </svg>
    <div class="legend">{tr({ fr: 'bande verte : 1 pu ± 5 %', en: 'green band: 1 pu ± 5 %' })}</div>
  </div>
</section>

<style>
  .body {
    display: flex;
    flex-direction: column;
  }
  svg {
    width: 100%;
    flex: 1;
    min-height: 140px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .band {
    fill: var(--good-soft);
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    fill: var(--muted);
    font-size: 10.5px;
  }
  .prof {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .pt {
    fill: var(--accent);
  }
  .pt.bad {
    fill: var(--warn);
  }
  .val {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .legend {
    font-size: 11px;
    color: var(--faint);
  }
</style>
