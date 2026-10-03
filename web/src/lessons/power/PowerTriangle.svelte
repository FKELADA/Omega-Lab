<script lang="ts">
  // The power triangle: P along, the motor's Q up, the capacitor's Q back down,
  // and S — what the supply and its cables must actually carry — as the hypotenuse.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { R_LINE, type PowerInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 190, M = 24;
  const k = $derived(lab.info as PowerInfo);
  const scale = $derived(Math.min((W - 2 * M - 40) / Math.max(k.P, 1e-9), (H - 40) / Math.max(k.Qload + Math.max(0, -k.Q), 1e-9)));
  const ox = M + 30, oy = $derived(H - 22 - Math.max(0, -k.Q) * scale);
  const X = (p: number) => ox + p * scale;
  const Y = (q: number) => oy - q * scale;
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
  /** Losses relative to unity power factor (same P). */
  const lossRatio = $derived(k.loss / (((k.P / lab.params.V) ** 2) * R_LINE));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Triangle des puissances', en: 'Power triangle' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Power triangle">
      <line x1={ox} y1={oy} x2={W - 6} y2={oy} class="axis" />
      <!-- load triangle -->
      <line x1={X(0)} y1={Y(0)} x2={X(k.P)} y2={Y(k.Qload)} class="sload" />
      <!-- P -->
      <g data-term="R" style="color: var(--c-R)" role="presentation" onmouseenter={enter('R')} onmouseleave={leave}>
        <line x1={X(0)} y1={Y(0)} x2={X(k.P)} y2={Y(0)} class="side" />
        <text x={X(k.P / 2)} y={Y(0) + 16} class="lbl">P = {si(k.P, 'W')}</text>
      </g>
      <!-- Q of the motor -->
      <g data-term="L" style="color: var(--c-L)" role="presentation" onmouseenter={enter('L')} onmouseleave={leave}>
        <line x1={X(k.P)} y1={Y(0)} x2={X(k.P)} y2={Y(k.Qload)} class="side" />
        <text x={X(k.P) + 8} y={Y(k.Qload / 2)} class="lbl" text-anchor="start">Q<tspan baseline-shift="sub" font-size="9">M</tspan></text>
        <text x={X(k.P) + 8} y={Y(k.Qload / 2) + 14} class="lbl" text-anchor="start">{si(k.Qload, 'var')}</text>
      </g>
      <!-- Q of the capacitor, back down -->
      {#if k.QC > 0}
        <g data-term="C" style="color: var(--c-C)" role="presentation" onmouseenter={enter('C')} onmouseleave={leave}>
          <line x1={X(k.P) - 8} y1={Y(k.Qload)} x2={X(k.P) - 8} y2={Y(k.Q)} class="side" />
          <text x={X(k.P) - 14} y={Y((k.Qload + k.Q) / 2)} class="lbl" text-anchor="end">−Q<tspan baseline-shift="sub" font-size="9">C</tspan></text>
        </g>
      {/if}
      <!-- S at the source -->
      <line x1={X(0)} y1={Y(0)} x2={X(k.P)} y2={Y(k.Q)} class="s" />
      <text x={X(k.P * 0.45)} y={Y(k.Q * 0.45) - 8} class="slbl">S = {si(cabs(k.S), 'VA')}</text>
    </svg>
    <dl>
      <dt>{tr({ fr: 'Facteur de puissance', en: 'Power factor' })}</dt>
      <dd>{num(k.pf, 3)} {k.phi > 0.5 ? tr({ fr: 'inductif', en: 'lagging' }) : k.phi < -0.5 ? tr({ fr: 'capacitif', en: 'leading' }) : ''}</dd>
      <dt>{tr({ fr: 'Courant de ligne', en: 'Line current' })}</dt>
      <dd>{si(cabs(k.I), 'A')}</dd>
      <dt>{tr({ fr: 'Pertes dans le câble', en: 'Cable losses' })}</dt>
      <dd>{si(k.loss, 'W')} <span class="ratio">(×{num(lossRatio, 3)} {tr({ fr: 'vs cos φ = 1', en: 'vs PF = 1' })})</span></dd>
    </dl>
  </div>
</section>

<style>
  .body {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  svg {
    width: 100%;
    flex: 1;
    min-height: 120px;
    display: block;
  }
  .axis {
    stroke: var(--line);
  }
  .side {
    stroke: currentColor;
    stroke-width: 4;
    stroke-linecap: round;
  }
  .sload {
    stroke: var(--faint);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }
  .s {
    stroke: var(--accent);
    stroke-width: 3;
  }
  .lbl {
    fill: currentColor;
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 600;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .slbl {
    fill: var(--accent);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 600;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    margin: 4px 0 0;
    font-size: 12.5px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-family: var(--mono);
    text-align: right;
  }
  .ratio {
    color: var(--warn);
  }
</style>
