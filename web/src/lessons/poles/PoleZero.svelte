<script lang="ts">
  // An s-plane you can grab: drag the pole pair (or click anywhere to move it
  // there), and drag the zero along the real axis. The green region is where the
  // poles meet the design target.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { PzInfo } from '../../lib/models/module3';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import { SPEC } from './spec';

  let { lab }: { lab: Lab } = $props();

  const W = 400, H = 260, M = 14;
  const xMin = -42, xMax = 10, yMax = 42;
  const k = (H / 2 - M) / yMax;
  const X = (re: number) => M + 18 + (re - xMin) * k;
  const Y = (im: number) => H / 2 - im * k;
  const toRe = (x: number) => xMin + (x - M - 18) / k;
  const toIm = (y: number) => (H / 2 - y) / k;
  const info = $derived(lab.info as PzInfo);

  // Design region: ζ ≥ ζmin (a cone) and σ ≤ −4/ts.
  const zetaMin = SPEC.zetaMin;
  const sigMax = -4 / SPEC.ts;
  const slope = Math.tan(Math.acos(zetaMin)); // |ωd| ≤ slope·|σ|
  const region = `M${X(sigMax)},${Y(slope * -sigMax)} L${X(xMin)},${Y(Math.min(yMax, slope * -xMin))} L${X(xMin)},${Y(-Math.min(yMax, slope * -xMin))} L${X(sigMax)},${Y(-slope * -sigMax)} Z`;

  let svg: SVGSVGElement;
  let drag: 'pole' | 'zero' | null = null;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  function at(e: PointerEvent) {
    const r = svg.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const [x, y] = at(e);
    const round = (v: number) => Math.round(v * 10) / 10;
    if (drag === 'pole') {
      lab.setParam('sigma', round(clamp(toRe(x), -40, 5)));
      lab.setParam('wd', round(clamp(Math.abs(toIm(y)), 0, 40)));
    } else {
      lab.setParam('z', round(clamp(toRe(x), -40, 40)));
    }
  }
  function down(e: PointerEvent, what: 'pole' | 'zero') {
    e.stopPropagation();
    svg.setPointerCapture(e.pointerId);
    drag = what;
    move(e);
  }
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Plan s : déplacez les pôles', en: 's-plane: drag the poles' })}</span>
    <span class="spacer"></span>
    <span class="note">ζ = {num(info.zeta, 3)} · ω<sub>n</sub> = {num(info.wn, 3)} rad/s</span>
  </header>
  <div class="body">
    <svg
      bind:this={svg}
      viewBox="0 0 {W} {H}"
      role="application"
      aria-label="s-plane"
      onpointerdown={(e) => down(e, 'pole')}
      onpointermove={move}
      onpointerup={() => (drag = null)}
    >
      <rect x={X(xMin)} y="0" width={X(0) - X(xMin)} height={H} class="lhp" />
      <path d={region} class="region" />
      <text x={X(xMin) + 6} y="16" class="rl">{tr({ fr: 'objectif', en: 'target' })}</text>
      <line x1={X(xMin)} x2={X(xMax)} y1={Y(0)} y2={Y(0)} class="axis" />
      <line x1={X(0)} x2={X(0)} y1="0" y2={H} class="axis" />
      {#each [-40, -30, -20, -10, 10] as v (v)}
        <text x={X(v)} y={Y(0) + 13} class="tick">{v}</text>
      {/each}
      {#each [-30, 30] as v (v)}
        <text x={X(0) + 4} y={Y(v) + 4} class="tick" text-anchor="start">{v}j</text>
      {/each}
      <text x={X(xMax) - 4} y={Y(0) - 6} class="lbl" text-anchor="end">σ</text>
      <text x={X(0) + 6} y="14" class="lbl" text-anchor="start">jω</text>

      {#if info.wn > 0}
        <circle cx={X(0)} cy={Y(0)} r={info.wn * k} class="wn" />
      {/if}

      {#if lab.params.hasZero}
        <g class="zero" role="presentation" onpointerdown={(e) => down(e, 'zero')}>
          <circle cx={X(info.z ?? 0)} cy={Y(0)} r="7" />
        </g>
      {/if}
      {#each [info.p1, info.p2] as p, j (j)}
        <g class="pole" transform="translate({X(p.re)},{Y(p.im)})" role="presentation" onpointerdown={(e) => down(e, 'pole')}>
          <circle r="13" class="halo" />
          <path d="M-7,-7L7,7M-7,7L7,-7" />
        </g>
      {/each}
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 260px;
    display: block;
    cursor: crosshair;
    touch-action: none;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .note {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    color: var(--ink);
  }
  .lhp {
    fill: var(--panel-2);
  }
  .region {
    fill: var(--good-soft);
    stroke: var(--good);
    stroke-dasharray: 4 3;
  }
  .rl {
    fill: var(--good);
    font-size: 11px;
    text-anchor: start;
  }
  .axis {
    stroke: var(--faint);
  }
  .tick {
    fill: var(--faint);
    font-size: 10px;
  }
  .lbl {
    fill: var(--muted);
    font-size: 13px;
    font-style: italic;
  }
  .wn {
    fill: none;
    stroke: var(--faint);
    stroke-dasharray: 2 4;
  }
  .pole {
    cursor: grab;
  }
  .pole path {
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .pole .halo {
    fill: var(--accent);
    opacity: 0.14;
  }
  .zero {
    cursor: ew-resize;
  }
  .zero circle {
    fill: var(--panel);
    stroke: var(--c-R);
    stroke-width: 3;
  }
</style>
