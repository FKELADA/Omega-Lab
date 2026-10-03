<script lang="ts">
  // Frequency response against a frequency parameter, on a log frequency axis.
  // Click or drag to move that parameter — the time-domain views follow.
  import { cabs, carg } from '../core/linalg';
  import type { Lab } from '../lab/lab.svelte';
  import { S, tr } from '../ui/ui.svelte';
  import { si } from '../ui/format';
  import { renderMath } from '../ui/markdown';

  let { lab }: { lab: Lab } = $props();

  const W = 360, H = 220;
  const M = { l: 50, r: 46, t: 10, b: 24 };
  let view = $state<'mag' | 'phase'>('mag');
  let svg: SVGSVGElement;

  const spec = $derived(lab.exp.bode!);
  const fNow = $derived(lab.params[spec.param]);
  const [fa, fb] = $derived(spec.range);

  const X = (f: number) => M.l + ((W - M.l - M.r) * Math.log(f / fa)) / Math.log(fb / fa);
  const Finv = (x: number) => fa * (fb / fa) ** ((x - M.l) / (W - M.l - M.r));

  /** Log-spaced grid, densified around the marks so sharp resonances are not missed. */
  const freqs = $derived.by(() => {
    const pts: number[] = [];
    for (let k = 0; k <= 400; k++) pts.push(fa * (fb / fa) ** (k / 400));
    for (const m of spec.marks?.(lab.params) ?? []) for (let k = -60; k <= 60; k++) pts.push(m.f * 1.002 ** k);
    const band = spec.band?.(lab.params);
    if (band) for (let k = 0; k <= 30; k++) pts.push(band[0] + ((band[1] - band[0]) * k) / 30);
    return [...new Set(pts.filter((f) => f >= fa && f <= fb))].sort((a, b) => a - b);
  });

  const units = $derived([...new Set(spec.curves.map((c) => c.unit))].slice(0, 2));

  const curves = $derived(
    spec.curves.map((c) => {
      const H = freqs.map((f) => c.H(lab.params, f));
      return { c, mag: H.map(cabs), phase: H.map((h) => (carg(h) * 180) / Math.PI) };
    }),
  );

  /** Linear magnitude axis per unit, from zero to a rounded maximum. */
  const yMax = $derived(
    Object.fromEntries(
      units.map((u) => {
        const m = Math.max(1e-30, ...curves.filter((x) => x.c.unit === u).flatMap((x) => x.mag));
        const step = 10 ** Math.floor(Math.log10(m));
        return [u, Math.ceil((m * 1.08) / step) * step];
      }),
    ),
  );
  const Y = (v: number, u: string) =>
    view === 'mag' ? H - M.b - ((H - M.t - M.b) * v) / yMax[u] : H - M.b - ((H - M.t - M.b) * (v + 180)) / 360;

  const paths = $derived(
    curves.map(({ c, mag, phase }) => ({
      c,
      d: freqs
        .map((f, k) => `${k ? 'L' : 'M'}${X(f).toFixed(1)},${Y(view === 'mag' ? mag[k] : phase[k], c.unit).toFixed(1)}`)
        .join(''),
    })),
  );

  /** Decade gridlines with 2 and 5 sub-ticks. */
  const xTicks = $derived.by(() => {
    const out: { f: number; major: boolean }[] = [];
    for (let e = Math.floor(Math.log10(fa)); e <= Math.ceil(Math.log10(fb)); e++)
      for (const m of [1, 2, 5]) {
        const f = m * 10 ** e;
        if (f >= fa * 0.999 && f <= fb * 1.001) out.push({ f, major: m === 1 });
      }
    return out;
  });
  const yTicks = (u: string) => [0, 0.25, 0.5, 0.75, 1].map((r) => r * yMax[u]);

  const band = $derived(spec.band?.(lab.params));
  const marks = $derived(spec.marks?.(lab.params) ?? []);

  let dragging = false;
  function setFrom(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const p = lab.exp.params.find((q) => q.id === spec.param)!;
    lab.setParam(spec.param, +Math.min(p.max, Math.max(p.min, Finv(x))).toPrecision(4));
  }
</script>

<section class="panel bode">
  <header>
    <span>{tr(S.bode)}</span>
    <div class="legend">
      {#each spec.curves as c (c.id)}
        <span
          style="--c: var({c.color})"
          role="presentation"
          data-term={c.term}
          onmouseenter={() => (lab.hover = c.term)}
          onmouseleave={() => (lab.hover = null)}><i></i>{@html renderMath(c.label)}</span
        >
      {/each}
    </div>
    <span class="spacer"></span>
    <div class="seg">
      <button class:on={view === 'mag'} onclick={() => (view = 'mag')}>{tr(S.magnitude)}</button>
      <button class:on={view === 'phase'} onclick={() => (view = 'phase')}>{tr(S.phase)}</button>
    </div>
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg
      bind:this={svg}
      viewBox="0 0 {W} {H}"
      role="img"
      aria-label={tr(S.bode)}
      onpointerdown={(e) => {
        dragging = true;
        svg.setPointerCapture(e.pointerId);
        setFrom(e);
      }}
      onpointermove={(e) => dragging && setFrom(e)}
      onpointerup={() => (dragging = false)}
    >
      {#if band && view === 'mag'}
        <rect x={X(band[0])} y={M.t} width={X(band[1]) - X(band[0])} height={H - M.t - M.b} class="band" />
      {/if}
      {#each xTicks as t (t.f)}
        <line x1={X(t.f)} x2={X(t.f)} y1={M.t} y2={H - M.b} class="grid" class:major={t.major} />
        <text x={X(t.f)} y={H - 8} class="tick" text-anchor="middle">{si(t.f, 'Hz', 2)}</text>
      {/each}
      {#if view === 'mag'}
        {#each units as u, k (u)}
          {#each yTicks(u) as v (v)}
            {#if k === 0}<line x1={M.l} x2={W - M.r} y1={Y(v, u)} y2={Y(v, u)} class="grid" />{/if}
            <text
              x={k === 0 ? M.l - 6 : W - M.r + 6}
              y={Y(v, u) + 3}
              class="tick"
              text-anchor={k === 0 ? 'end' : 'start'}>{si(v, u, 2)}</text
            >
          {/each}
        {/each}
      {:else}
        {#each [-180, -90, 0, 90, 180] as v (v)}
          <line x1={M.l} x2={W - M.r} y1={Y(v, '')} y2={Y(v, '')} class="grid" class:major={v === 0} />
          <text x={M.l - 6} y={Y(v, '') + 3} class="tick" text-anchor="end">{v}°</text>
        {/each}
      {/if}
      {#each marks as m (m.label)}
        <line x1={X(m.f)} x2={X(m.f)} y1={M.t} y2={H - M.b} class="mark" />
        <text x={X(m.f) + 4} y={M.t + 11} class="marklbl">{m.label}</text>
      {/each}
      {#each paths as p (p.c.id)}
        <path d={p.d} class="curve" style="stroke: var({p.c.color})" data-term={p.c.term} />
      {/each}
      <line x1={X(fNow)} x2={X(fNow)} y1={M.t} y2={H - M.b} class="cursor" />
    </svg>
    <div class="foot">f = <b>{si(fNow, 'Hz')}</b> · {tr(S.clickToTune)}</div>
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
    min-height: 150px;
    display: block;
    cursor: ew-resize;
    touch-action: none;
    font-family: var(--font);
  }
  .grid {
    stroke: var(--line);
  }
  .grid.major {
    stroke: var(--faint);
    stroke-opacity: 0.5;
  }
  .tick {
    fill: var(--muted);
    font-size: 11px;
  }
  .band {
    fill: var(--hot);
  }
  .mark {
    stroke: var(--faint);
    stroke-dasharray: 2 3;
  }
  .marklbl {
    fill: var(--muted);
    font-size: 11px;
  }
  .curve {
    fill: none;
    stroke-width: 2;
  }
  .cursor {
    stroke: var(--accent);
    stroke-width: 2;
  }
  .legend {
    display: flex;
    gap: 10px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--c);
    border-radius: 4px;
    padding: 0 3px;
  }
  .legend i {
    width: 9px;
    height: 3px;
    background: var(--c);
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 6px;
    overflow: hidden;
    text-transform: none;
    letter-spacing: 0;
  }
  .seg button {
    border: none;
    background: var(--panel);
    font-size: 12px;
    padding: 1px 8px;
    color: var(--muted);
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--ink);
  }
  .foot {
    font-size: 12px;
    color: var(--muted);
    padding-top: 4px;
  }
  .foot b {
    font-family: var(--mono);
    color: var(--ink);
    font-weight: 500;
  }
</style>
