<script lang="ts">
  // The impedance plane: Z = R + jX as a point, its triangle, and the locus the
  // point follows as the frequency sweeps the slider's range.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { impedanceOf, type ImpedanceInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 260, M = 28;
  const k = $derived(lab.info as ImpedanceInfo);
  const fSpec = $derived(lab.exp.params.find((p) => p.id === 'f')!);

  const locus = $derived.by(() => {
    const out: { re: number; im: number }[] = [];
    for (let j = 0; j <= 200; j++) out.push(impedanceOf(lab.params, fSpec.min * (fSpec.max / fSpec.min) ** (j / 200)));
    return out;
  });

  // Fit the current point comfortably; the locus is clipped beyond that.
  const E = $derived(Math.max(1e-9, Math.abs(k.Z.re), Math.abs(k.Z.im), lab.params.R) * 1.35);
  const s = $derived((H / 2 - M) / E);
  const ox = $derived(M + 24);
  const oy = H / 2;
  const X = (re: number) => ox + re * s;
  const Y = (im: number) => oy - im * s;
  const clip = (z: { re: number; im: number }) => Math.abs(z.im) <= E && z.re <= (W - ox - 8) / s;

  const path = $derived(
    locus
      .filter(clip)
      .map((z, j) => `${j ? 'L' : 'M'}${X(z.re).toFixed(1)},${Y(z.im).toFixed(1)}`)
      .join(''),
  );
  const arc = $derived.by(() => {
    const r = 26, a = Math.atan2(k.Z.im, k.Z.re);
    if (Math.abs(a) < 0.02) return '';
    return `M${X(0) + r},${oy} A${r},${r} 0 0 ${a > 0 ? 0 : 1} ${X(0) + r * Math.cos(a)},${oy - r * Math.sin(a)}`;
  });
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Plan des impédances', en: 'Impedance plane' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Impedance plane">
      <line x1={X(0)} x2={W - 6} y1={oy} y2={oy} class="axis" />
      <line x1={X(0)} x2={X(0)} y1="6" y2={H - 6} class="axis" />
      <text x={W - 8} y={oy - 6} class="lbl" text-anchor="end">R</text>
      <text x={X(0) + 6} y="16" class="lbl">jX</text>
      <text x={X(0) - 6} y="22" class="hint" text-anchor="end">{tr({ fr: 'inductif', en: 'inductive' })}</text>
      <text x={X(0) - 6} y={H - 12} class="hint" text-anchor="end">{tr({ fr: 'capacitif', en: 'capacitive' })}</text>

      <path d={path} class="locus" />
      <!-- triangle -->
      <line x1={X(0)} y1={oy} x2={X(k.Z.re)} y2={oy} class="side" style="stroke: var(--c-R)" data-term="R" role="presentation" onmouseenter={enter('R')} onmouseleave={leave} />
      <line
        x1={X(k.Z.re)}
        y1={oy}
        x2={X(k.Z.re)}
        y2={Y(k.Z.im)}
        class="side"
        style="stroke: var({k.Z.im >= 0 ? '--c-L' : '--c-C'})"
        data-term={k.Z.im >= 0 ? 'L' : 'C'}
        role="presentation"
        onmouseenter={enter(k.Z.im >= 0 ? 'L' : 'C')}
        onmouseleave={leave}
      />
      <line x1={X(0)} y1={oy} x2={X(k.Z.re)} y2={Y(k.Z.im)} class="hyp" />
      {#if arc}<path d={arc} class="arc" />{/if}
      <circle cx={X(k.Z.re)} cy={Y(k.Z.im)} r="5" class="pt" />
      <text x={X(k.Z.re) + 8} y={Y(k.Z.im) + (k.Z.im >= 0 ? -6 : 14)} class="zl">Z</text>
    </svg>
    <div class="readout">
      <span>R = {si(k.Z.re, 'Ω')}</span>
      <span>X = {si(k.Z.im, 'Ω')}</span>
      <span>|Z| = {si(Math.hypot(k.Z.re, k.Z.im), 'Ω')}</span>
      <span>φ = {num(k.phi, 3)}°</span>
    </div>
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
    min-height: 160px;
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
  .hint {
    fill: var(--faint);
    font-size: 10.5px;
  }
  .locus {
    fill: none;
    stroke: var(--faint);
    stroke-dasharray: 3 3;
  }
  .side {
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .hyp {
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .arc {
    fill: none;
    stroke: var(--accent);
  }
  .pt {
    fill: var(--accent);
  }
  .zl {
    fill: var(--accent);
    font-weight: 700;
    font-size: 13px;
  }
  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--muted);
  }
</style>
