<script lang="ts">
  // State space, literally: δ across, Δf up. Nonlinear trajectory solid, linear
  // dashed. Small disturbances: the two overlap. Large ones: they part ways.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { S, tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 260, H = 220, M = 22;
  const s = $derived(lab.run.s);
  const box = $derived.by(() => {
    const ds = [...s.delta, ...s.deltaLin].filter((v) => v < 400);
    const fs = [...s.df, ...s.dfLin].map(Math.abs);
    return {
      dmin: Math.min(...ds) - 2,
      dmax: Math.max(...ds) + 2,
      fmax: Math.max(1e-4, ...fs.filter((v) => v < 20)) * 1.15,
    };
  });
  const X = (d: number) => M + ((W - 2 * M) * (d - box.dmin)) / (box.dmax - box.dmin);
  const Y = (f: number) => H / 2 - ((H / 2 - M) * f) / box.fmax;
  const path = (d: Float64Array, f: Float64Array) => {
    let p = '';
    for (let j = 0; j < d.length; j += 2) if (d[j] < 400) p += `${p ? 'L' : 'M'}${X(d[j]).toFixed(1)},${Y(f[j]).toFixed(1)}`;
    return p;
  };
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Plan de phase', en: 'Phase portrait' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Phase portrait">
      <line x1={M} x2={W - M} y1={Y(0)} y2={Y(0)} class="axis" />
      <text x={W - M} y={Y(0) - 5} class="lbl" text-anchor="end">δ</text>
      <text x={M + 4} y={M - 6} class="lbl" text-anchor="start">Δf</text>
      <path d={path(s.deltaLin, s.dfLin)} class="lin" />
      <path d={path(s.delta, s.df)} class="nl" />
      {#if lab.at('delta') < 400}
        <circle cx={X(lab.at('delta'))} cy={Y(lab.at('df'))} r="5" class="now" />
      {/if}
    </svg>
    <div class="legend">
      <span><i class="nl-i"></i>{tr({ fr: 'non linéaire', en: 'nonlinear' })}</span>
      <span><i class="lin-i"></i>{tr({ fr: 'linéarisé', en: 'linearised' })}</span>
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
  .axis {
    stroke: var(--faint);
  }
  .lbl {
    fill: var(--muted);
    font-size: 12px;
    font-style: italic;
  }
  .nl {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2;
  }
  .lin {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 1.6;
    stroke-dasharray: 5 4;
  }
  .now {
    fill: var(--accent);
  }
  .legend {
    display: flex;
    gap: 12px;
    font-size: 11.5px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 14px;
    height: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }
  .nl-i {
    background: var(--c-p);
  }
  .lin-i {
    background: var(--c-R);
  }
</style>
