<script lang="ts">
  import type { Complex } from '../core/linalg';
  import type { Lab } from '../lab/lab.svelte';
  import { S, tr } from '../ui/ui.svelte';
  import { num, si } from '../ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 400, H = 270, M = 26;

  const ghostPoles = $derived(lab.ghosts.map((g) => lab.exp.model.poles(g.params)));
  const fanPoles = $derived(
    lab.fan ? lab.fan.values.map((v) => lab.exp.model.poles({ ...lab.params, [lab.fan!.param]: v })) : [],
  );

  /** Root locus of the experiment's locus parameter across its whole range. */
  const locus = $derived.by(() => {
    const spec = lab.exp.params.find((p) => p.id === lab.exp.locusParam);
    if (!spec) return [] as Complex[];
    const out: Complex[] = [];
    for (let k = 0; k <= 220; k++) {
      const f = k / 220;
      const v = spec.scale === 'log' ? spec.min * (spec.max / spec.min) ** f : spec.min + (spec.max - spec.min) * f;
      out.push(...lab.exp.model.poles({ ...lab.params, [spec.id]: v }));
    }
    return out;
  });

  // Equal-aspect view sized to the poles on show.
  const view = $derived.by(() => {
    const all = [...lab.poles, ...ghostPoles.flat(), ...fanPoles.flat()];
    const E = Math.max(1e-6, ...all.map((p) => Math.max(Math.abs(p.im), Math.abs(p.re) / 2.4))) * 1.15;
    const k = (H / 2 - M) / E;
    return { E, k, ox: W - M - 0.25 * E * k, oy: H / 2 };
  });
  const X = (re: number) => view.ox + re * view.k;
  const Y = (im: number) => view.oy - im * view.k;
  const inView = (p: Complex) => X(p.re) >= M - 2 && Y(p.im) >= 4 && Y(p.im) <= H - 4;

  const omega0 = $derived(Math.hypot(lab.poles[0].re, lab.poles[0].im) * (lab.poles[0].im ? 1 : NaN));

  const fmtPole = (p: Complex) =>
    `${num(p.re)}${p.im ? (p.im > 0 ? ' + j' : ' − j') + num(Math.abs(p.im)) : ''} s⁻¹`;
</script>

<section class="panel">
  <header>
    <span>{tr(S.splane)}</span>
    <span class="spacer"></span>
    <span class="regime">{lab.exp.poleLabel && !lab.concealed ? tr(lab.exp.poleLabel(lab.params, lab.info)) : ''}</span>
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={tr(S.splane)}>
      <!-- stable half-plane shading -->
      <rect x={M} y="4" width={view.ox - M} height={H - 8} class="lhp" />
      <line x1={M} x2={W - 4} y1={view.oy} y2={view.oy} class="axis" />
      <line x1={view.ox} x2={view.ox} y1="4" y2={H - 4} class="axis" />
      <text x={W - 8} y={view.oy - 6} class="lbl" text-anchor="end">σ</text>
      <text x={view.ox + 6} y="16" class="lbl">jω</text>
      <text x={view.ox + 6} y={Y(view.E) + 4} class="tick">{num(view.E, 2)}</text>
      <line x1={view.ox - 3} x2={view.ox + 3} y1={Y(view.E)} y2={Y(view.E)} class="axis" />
      <text x={X(-2 * view.E)} y={view.oy + 14} class="tick" text-anchor="middle">{num(-2 * view.E, 2)}</text>
      <line x1={X(-2 * view.E)} x2={X(-2 * view.E)} y1={view.oy - 3} y2={view.oy + 3} class="axis" />

      {#if isFinite(omega0)}
        <circle cx={view.ox} cy={view.oy} r={omega0 * view.k} class="w0" />
      {/if}

      {#each locus as p, k (k)}
        {#if inView(p)}<circle cx={X(p.re)} cy={Y(p.im)} r="1.1" class="locus" />{/if}
      {/each}

      {#each fanPoles as ps, k (k)}
        {#each ps as p, j (j)}
          {#if inView(p)}<circle cx={X(p.re)} cy={Y(p.im)} r="3.2" class="fan" />{/if}
        {/each}
      {/each}

      {#each ghostPoles as ps, k (k)}
        {#each ps as p, j (j)}
          <g transform="translate({X(p.re)},{Y(p.im)})" class="ghost">
            <path d="M-5,-5L5,5M-5,5L5,-5" />
          </g>
        {/each}
      {/each}

      {#each lab.poles as p, j (j)}
        <g transform="translate({X(p.re)},{Y(p.im)})" class="pole">
          <title>{fmtPole(p)}</title>
          <circle r="11" class="halo" />
          <path d="M-6,-6L6,6M-6,6L6,-6" />
        </g>
      {/each}
    </svg>
    <div class="readout">
      {#if !lab.concealed}
        <span>s₁,₂ = {fmtPole(lab.poles[0])}{lab.poles[1] && lab.poles[1].im === 0 ? ` ; ${fmtPole(lab.poles[1])}` : ''}</span>
        {#if lab.poles[0].im}
          <span>f = {si(Math.abs(lab.poles[0].im) / (2 * Math.PI), 'Hz')}</span>
        {/if}
      {/if}
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
    max-height: 260px;
  }
  .lhp {
    fill: var(--good-soft);
    opacity: 0.6;
  }
  .axis {
    stroke: var(--faint);
    stroke-width: 1;
  }
  .lbl {
    fill: var(--muted);
    font-size: 13px;
    font-style: italic;
  }
  .tick {
    fill: var(--faint);
    font-size: 10px;
    font-family: var(--mono);
  }
  .w0 {
    fill: none;
    stroke: var(--faint);
    stroke-dasharray: 3 4;
  }
  .locus {
    fill: var(--faint);
    opacity: 0.6;
  }
  .fan {
    fill: var(--c-R);
    opacity: 0.55;
  }
  .ghost path {
    stroke: var(--faint);
    stroke-width: 2;
  }
  .pole path {
    stroke: var(--accent);
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .pole .halo {
    fill: var(--accent);
    opacity: 0.12;
  }
  .regime {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    color: var(--ink);
  }
  .readout {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--muted);
  }
</style>
