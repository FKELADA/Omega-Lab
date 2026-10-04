<script lang="ts">
  // Seen from the nominal 50 Hz frame: the grid voltage vector, and the d axis the
  // PLL believes in. The angle between them is the tracking error; v_q is the
  // grid vector's shadow on the PLL's q axis.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { phiGrid } from '../../lib/models/module3';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 260, H = 230, R = 80, cx = 130, cy = 112;
  const pg = $derived(phiGrid(lab.params, lab.t));
  const ph = $derived(pg - (lab.at('err') * Math.PI) / 180);
  const P = (a: number, r = R): [number, number] => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
  const g = $derived(P(pg));
  const d = $derived(P(ph, R * 1.1));
  const q = $derived(P(ph + Math.PI / 2, R * 0.9));
  // Projection of the grid vector on the estimated q axis.
  const vqTip = $derived(P(ph + Math.PI / 2, R * Math.sin(pg - ph)));
  const arc = $derived.by(() => {
    const r = 30, e = pg - ph;
    if (Math.abs(e) < 0.01) return '';
    const [x1, y1] = P(ph, r), [x2, y2] = P(pg, r);
    return `M${x1},${y1} A${r},${r} 0 ${Math.abs(e) > Math.PI ? 1 : 0} ${e > 0 ? 0 : 1} ${x2},${y2}`;
  });
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Suivi de phase', en: 'Phase tracking' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Phase tracking">
      <circle {cx} {cy} r={R} class="ring" />
      <line x1={cx} y1={cy} x2={d[0]} y2={d[1]} class="axis" />
      <line x1={cx} y1={cy} x2={q[0]} y2={q[1]} class="axis q" />
      <text x={d[0]} y={d[1]} dx="4" dy="4" class="al">d̂</text>
      <text x={q[0]} y={q[1]} dx="4" dy="-2" class="al">q̂</text>
      <line x1={g[0]} y1={g[1]} x2={vqTip[0]} y2={vqTip[1]} class="drop" />
      <line x1={cx} y1={cy} x2={vqTip[0]} y2={vqTip[1]} class="vq" />
      {#if arc}<path d={arc} class="arc" />{/if}
      <line x1={cx} y1={cy} x2={g[0]} y2={g[1]} class="grid" />
      <circle cx={g[0]} cy={g[1]} r="4.5" class="gtip" />
      <text x={g[0]} y={g[1]} dx="6" dy="-6" class="gl">v</text>
    </svg>
    <div class="readout">
      <span>ε = <b>{num(lab.at('err'), 3)}°</b></span>
      <span>v<sub>q</sub> = <b>{num(lab.at('vq'), 3)}</b> pu</span>
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
    display: block;
  }
  .ring {
    fill: none;
    stroke: var(--line);
    stroke-dasharray: 3 3;
  }
  .axis {
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-dasharray: 6 4;
  }
  .al {
    fill: var(--accent);
    font-size: 12px;
    font-weight: 700;
  }
  .grid {
    stroke: var(--c-S);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .gtip {
    fill: var(--c-S);
  }
  .gl {
    fill: var(--c-S);
    font-weight: 700;
    font-size: 13px;
  }
  .drop {
    stroke: var(--c-C);
    stroke-dasharray: 2 3;
  }
  .vq {
    stroke: var(--c-C);
    stroke-width: 3;
  }
  .arc {
    fill: none;
    stroke: var(--warn);
    stroke-width: 2;
  }
  .readout {
    display: flex;
    gap: 14px;
    font-size: 12.5px;
    font-family: var(--mono);
  }
</style>
