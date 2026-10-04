<script lang="ts">
  // Each harmonic is a vector of length b_n turning at n·ω; chained head to tail,
  // their tip's height is the partial sum. The trace on the right is that height
  // over the last period, drawn as time runs.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { FourierInfo } from '../../lib/models/module2b';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 400, H = 250;
  const cx0 = 95, cy = 125;
  const k = $derived(lab.info as FourierInfo);
  const R = 80;
  /** Partial sums peak at about 1.18 (Gibbs), so 1.25 leaves headroom. */
  const s = R / 1.25;
  const w = $derived(2 * Math.PI * lab.params.f);

  /** Chain of vectors at time t: sin(nωt) is the height of a vector at angle nωt. */
  const chain = $derived.by(() => {
    const pts: { x: number; y: number; r: number }[] = [];
    let x = cx0, y = cy;
    for (let n = 1; n <= lab.params.N; n++) {
      const b = k.b[n];
      if (!b) continue;
      const a = n * w * lab.t;
      const r = Math.abs(b) * s;
      const sign = Math.sign(b);
      const nx = x + sign * r * Math.cos(a), ny = y - sign * r * Math.sin(a);
      pts.push({ x, y, r });
      x = nx;
      y = ny;
    }
    pts.push({ x, y, r: 0 });
    return pts;
  });
  const tipY = $derived(chain[chain.length - 1].y);
  const traceX0 = 230;

  /** The partial sum over one period, scrolling with time. */
  const trace = $derived.by(() => {
    const T = 1 / lab.params.f;
    let d = '';
    for (let j = 0; j <= 160; j++) {
      const tt = lab.t - (j / 160) * T;
      let v = 0;
      for (let n = 1; n <= lab.params.N; n++) if (k.b[n]) v += k.b[n] * Math.sin(n * w * tt);
      d += `${j ? 'L' : 'M'}${(traceX0 + j).toFixed(1)},${(cy - v * s).toFixed(1)}`;
    }
    return d;
  });
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Épicycles de Fourier', en: 'Fourier epicycles' })}</span>
    <span class="spacer"></span>
    <span class="note">N = {lab.params.N}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Fourier epicycles">
      <line x1="10" x2={W - 10} y1={cy} y2={cy} class="axis" />
      {#each chain.slice(0, -1) as c, j (j)}
        <circle cx={c.x} cy={c.y} r={c.r} class="ring" class:first={j === 0} />
        <line x1={c.x} y1={c.y} x2={chain[j + 1].x} y2={chain[j + 1].y} class="arm" class:first={j === 0} />
      {/each}
      <line x1={chain[chain.length - 1].x} y1={tipY} x2={traceX0} y2={tipY} class="link" />
      <circle cx={chain[chain.length - 1].x} cy={tipY} r="3.5" class="tip" />
      <path d={trace} class="trace" />
      <circle cx={traceX0} cy={tipY} r="3.5" class="tip" />
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 250px;
    display: block;
  }
  .note {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    color: var(--ink);
  }
  .axis {
    stroke: var(--line);
  }
  .ring {
    fill: none;
    stroke: var(--faint);
    stroke-width: 0.8;
    opacity: 0.7;
  }
  .ring.first {
    stroke: var(--c-v1);
    opacity: 1;
  }
  .arm {
    stroke: var(--muted);
    stroke-width: 1.4;
  }
  .arm.first {
    stroke: var(--c-v1);
    stroke-width: 2.2;
  }
  .link {
    stroke: var(--accent);
    stroke-dasharray: 3 3;
  }
  .tip {
    fill: var(--accent);
  }
  .trace {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2;
  }
</style>
