<script lang="ts">
  // Nyquist plot of L(jω), zoomed on the critical point −1. The loop is stable
  // if the curve passes to the right of −1 (no encirclement: Z = N + P with P = 0).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { loopL, type LoopInfo } from '../../lib/models/module3';
  import { S, tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 260, H = 250;
  const E = 2.2; // half-width of the view, around the origin
  const s = (H / 2 - 10) / E;
  const ox = W / 2 + 20, oy = H / 2;
  const X = (re: number) => ox + re * s;
  const Y = (im: number) => oy - im * s;
  const k = $derived(lab.info as LoopInfo);

  const path = $derived.by(() => {
    let pos = '', neg = '';
    for (let j = 0; j <= 600; j++) {
      const w = 1e-3 * 1e7 ** (j / 600);
      const L = loopL(lab.params, w);
      // Clip far points to the view edge so the path stays drawable.
      const r = Math.hypot(L.re, L.im);
      const f = r > 3 * E ? (3 * E) / r : 1;
      pos += `${j ? 'L' : 'M'}${X(L.re * f).toFixed(1)},${Y(L.im * f).toFixed(1)}`;
      neg += `${j ? 'L' : 'M'}${X(L.re * f).toFixed(1)},${Y(-L.im * f).toFixed(1)}`;
    }
    return { pos, neg };
  });
</script>

<section class="panel">
  <header><span>Nyquist</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Nyquist plot">
      <defs>
        <clipPath id="nyq"><rect x="0" y="0" width={W} height={H} /></clipPath>
      </defs>
      <line x1="0" x2={W} y1={oy} y2={oy} class="axis" />
      <line x1={ox} x2={ox} y1="0" y2={H} class="axis" />
      <circle cx={ox} cy={oy} r={s} class="unit" />
      <g clip-path="url(#nyq)">
        <path d={path.neg} class="curve neg" />
        <path d={path.pos} class="curve" />
      </g>
      <circle cx={X(-1)} cy={Y(0)} r="5" class="crit" class:bad={!k.stable} />
      <text x={X(-1)} y={Y(0) + 18} class="lbl">−1</text>
      <text x={W - 6} y={oy - 6} class="lbl" text-anchor="end">Re</text>
      <text x={ox + 6} y="12" class="lbl" text-anchor="start">Im</text>
    </svg>
    <div class="verdict" class:bad={!k.stable}>
      {k.stable
        ? tr({ fr: '−1 n’est pas entouré : boucle stable', en: '−1 is not encircled: stable loop' })
        : tr({ fr: '−1 est entouré : boucle instable', en: '−1 is encircled: unstable loop' })}
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 240px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .axis {
    stroke: var(--faint);
  }
  .unit {
    fill: none;
    stroke: var(--line);
    stroke-dasharray: 3 3;
  }
  .curve {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2.2;
  }
  .curve.neg {
    stroke-dasharray: 4 4;
    opacity: 0.6;
  }
  .crit {
    fill: var(--good);
  }
  .crit.bad {
    fill: var(--warn);
  }
  .lbl {
    fill: var(--muted);
    font-size: 11px;
  }
  .verdict {
    font-size: 12px;
    color: var(--good);
    font-weight: 600;
  }
  .verdict.bad {
    color: var(--warn);
  }
</style>
