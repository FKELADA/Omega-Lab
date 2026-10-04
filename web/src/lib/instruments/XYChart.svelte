<script lang="ts">
  // A characteristic chart driven entirely by the lesson's ChartSpec: curves, live
  // operating points, bands and markers. Used for torque–slip, P–V nose curves,
  // V–I characteristics, capability charts and voltage profiles.
  import type { Lab } from '../lab/lab.svelte';
  import type { ChartAxis } from '../lab/types';
  import { S, tr } from '../ui/ui.svelte';
  import { num } from '../ui/format';

  let { lab, index }: { lab: Lab; index: number } = $props();

  const W = 320, H = 220, M = { l: 44, r: 12, t: 12, b: 30 };
  const spec = $derived(lab.exp.charts![index]);
  const rng = (a: ChartAxis): [number, number] => (typeof a.range === 'function' ? a.range(lab) : a.range);
  const xr = $derived(rng(spec.x));
  const yr = $derived(rng(spec.y));
  const fx = (v: number) => (spec.x.log ? Math.log10(Math.max(1e-12, v)) : v);
  const X = (v: number) => M.l + ((W - M.l - M.r) * (fx(v) - fx(xr[0]))) / (fx(xr[1]) - fx(xr[0]));
  const Y = (v: number) => H - M.b - ((H - M.t - M.b) * (v - yr[0])) / (yr[1] - yr[0]);
  const clipY = (v: number) => Math.max(M.t - 4, Math.min(H - M.b + 4, Y(v)));

  /** About five round-number ticks. */
  function ticks(a: [number, number], log = false): number[] {
    if (log) {
      const out: number[] = [];
      for (let e = Math.ceil(Math.log10(a[0])); e <= Math.floor(Math.log10(a[1])); e++) out.push(10 ** e);
      return out;
    }
    const span = a[1] - a[0];
    const raw = span / 5;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= 6)!;
    const out: number[] = [];
    for (let v = Math.ceil(a[0] / step) * step; v <= a[1] + 1e-9 * step; v += step) out.push(+v.toPrecision(12));
    return out;
  }

  const series = $derived(spec.series(lab));
  const paths = $derived(
    series.map((s) => ({
      s,
      d: s.pts
        .filter(([x, y]) => isFinite(x) && isFinite(y))
        .map(([x, y], j) => `${j ? 'L' : 'M'}${X(x).toFixed(1)},${clipY(y).toFixed(1)}`)
        .join(''),
    })),
  );
  const points = $derived(spec.points?.(lab) ?? []);
  const bands = $derived(spec.bands?.(lab) ?? []);
  const vlines = $derived(spec.vlines?.(lab) ?? []);
  const note = $derived(spec.note?.(lab) ?? null);
  const label = (a: ChartAxis) => (a.unit ? `${a.label} (${a.unit})` : a.label);
</script>

<section class="panel">
  <header><span>{tr(spec.title)}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={tr(spec.title)}>
      <defs>
        <clipPath id="xy-clip-{index}"><rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} /></clipPath>
      </defs>
      {#each bands as b, j (j)}
        <rect x={M.l} width={W - M.l - M.r} y={Y(Math.min(yr[1], b.y1))} height={Math.max(0, Y(Math.max(yr[0], b.y0)) - Y(Math.min(yr[1], b.y1)))} class="band" />
      {/each}
      {#each ticks(yr) as v (v)}
        <line x1={M.l} x2={W - M.r} y1={Y(v)} y2={Y(v)} class="grid" class:zero={v === 0} />
        <text x={M.l - 4} y={Y(v) + 3} class="tick" text-anchor="end">{num(v, 3)}</text>
      {/each}
      {#each ticks(xr, spec.x.log) as v (v)}
        <line x1={X(v)} x2={X(v)} y1={M.t} y2={H - M.b} class="grid" class:zero={v === 0} />
        <text x={X(v)} y={H - M.b + 12} class="tick">{num(v, 3)}</text>
      {/each}
      <text x={W - M.r} y={H - 4} class="axl" text-anchor="end">{label(spec.x)}</text>
      <text x={M.l + 2} y={M.t - 2} class="axl" text-anchor="start">{label(spec.y)}</text>
      <g clip-path="url(#xy-clip-{index})">
        {#each vlines as v, j (j)}
          <line x1={X(v.x)} x2={X(v.x)} y1={M.t} y2={H - M.b} class="vline" />
        {/each}
        {#each paths as p, j (j)}
          <path d={p.d} class="curve" class:dash={p.s.dash} style="stroke: var({p.s.color}); stroke-width: {p.s.width ?? 2}" />
        {/each}
        {#each points as pt, j (j)}
          <circle cx={X(pt.x)} cy={Y(pt.y)} r="5" class="pt" class:hollow={pt.hollow} style="--c: var({pt.color})" />
          {#if pt.label}<text x={X(pt.x) + 7} y={Y(pt.y) - 7} class="ptl" style="fill: var({pt.color})">{pt.label}</text>{/if}
        {/each}
      </g>
      {#each vlines as v, j (j)}
        {#if v.label}<text x={X(v.x) + 3} y={M.t + 10} class="vl">{v.label}</text>{/if}
      {/each}
    </svg>
    {#if series.some((s) => s.label)}
      <div class="legend">
        {#each series.filter((s) => s.label) as s, j (j)}
          <span><i style="background: var({s.color})" class:dash={s.dash}></i>{tr(s.label!)}</span>
        {/each}
      </div>
    {/if}
    {#if note}<div class="note">{tr(note)}</div>{/if}
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
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
  .grid.zero {
    stroke: var(--faint);
  }
  .tick {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .axl {
    fill: var(--muted);
    font-size: 10px;
    font-style: italic;
  }
  .curve {
    fill: none;
  }
  .curve.dash {
    stroke-dasharray: 5 4;
  }
  .pt {
    fill: var(--c);
    stroke: var(--panel);
    stroke-width: 1.5;
  }
  .pt.hollow {
    fill: var(--panel);
    stroke: var(--c);
    stroke-width: 2;
  }
  .ptl {
    font-size: 10.5px;
    font-weight: 700;
  }
  .vline {
    stroke: var(--faint);
    stroke-dasharray: 2 3;
  }
  .vl {
    fill: var(--muted);
    font-size: 10px;
    text-anchor: start;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    font-size: 11px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 14px;
    height: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }
  .note {
    font-size: 11.5px;
    color: var(--muted);
    margin-top: 4px;
  }
</style>
