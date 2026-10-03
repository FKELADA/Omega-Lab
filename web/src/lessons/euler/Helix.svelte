<script lang="ts">
  // e^{j(ωt+φ)} drawn in 3D: time runs along one axis, the complex plane is the
  // cross-section. Seen from the side it is the sine, from above the cosine, and
  // end-on the rotating phasor on its circle. Drag to turn it.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { TwoPhasorInfo } from '../../lib/models/twoPhasors';
  import { deg } from '../../lib/models/twoPhasors';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 400, H = 260;
  let az = $state(35);
  let el = $state(22);
  let showSum = $state(false);
  let anim = 0;

  const views = [
    { id: 'iso', az: 35, el: 22, label: { fr: '3D', en: '3D' } },
    { id: 'side', az: 0, el: 0, label: { fr: 'Côté : Im → sin', en: 'Side: Im → sin' } },
    { id: 'top', az: 0, el: 90, label: { fr: 'Dessus : Re → cos', en: 'Top: Re → cos' } },
    { id: 'end', az: 90, el: 0, label: { fr: 'Bout : cercle', en: 'End: circle' } },
  ];

  function goTo(v: { id: string; az: number; el: number }) {
    if (v.id === 'end') lab.flags.endView = true;
    cancelAnimationFrame(anim);
    const a0 = az, e0 = el, t0 = performance.now();
    const step = (now: number) => {
      const f = Math.min(1, (now - t0) / 600);
      const s = f * f * (3 - 2 * f);
      az = a0 + (v.az - a0) * s;
      el = e0 + (v.el - e0) * s;
      if (f < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  const k = $derived(lab.info as TwoPhasorInfo);
  const amax = $derived(Math.max(k.amp, lab.params.A1, lab.params.A2, 1e-9));

  /** Orthographic projection of (time, Re, Im). */
  const proj = $derived.by(() => {
    const ca = Math.cos(az * deg), sa = Math.sin(az * deg), ce = Math.cos(el * deg), se = Math.sin(el * deg);
    const Lt = 260, R = 78 / amax;
    return (tt: number, re: number, im: number): [number, number] => {
      const x = (tt / lab.tEnd - 0.5) * Lt, y = re * R, z = im * R;
      const x1 = x * ca + y * sa;
      const y1 = -x * sa + y * ca;
      const z2 = z * ce + y1 * se;
      return [W / 2 + x1, H / 2 - z2];
    };
  });

  function helix(A: number, phi: number) {
    const w = k.omega;
    let d = '';
    for (let j = 0; j <= 360; j++) {
      const tt = (j / 360) * lab.tEnd;
      const [x, y] = proj(tt, A * Math.cos(w * tt + phi), A * Math.sin(w * tt + phi));
      d += `${j ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  }

  const path1 = $derived(helix(lab.params.A1, lab.params.phi1 * deg));
  const pathS = $derived(showSum ? helix(k.amp, k.phase * deg) : '');
  const now = $derived.by(() => {
    const th = k.omega * lab.t + lab.params.phi1 * deg;
    const A = lab.params.A1;
    return { axis: proj(lab.t, 0, 0), tip: proj(lab.t, A * Math.cos(th), A * Math.sin(th)) };
  });
  const ring = $derived.by(() => {
    let d = '';
    for (let j = 0; j <= 72; j++) {
      const a = (j / 72) * 2 * Math.PI;
      const [x, y] = proj(lab.t, lab.params.A1 * Math.cos(a), lab.params.A1 * Math.sin(a));
      d += `${j ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    return d;
  });
  const axes = $derived({
    t0: proj(0, 0, 0),
    t1: proj(lab.tEnd, 0, 0),
    re: proj(0, amax * 1.25, 0),
    im: proj(0, 0, amax * 1.25),
  });

  let drag: { x: number; y: number; az: number; el: number } | null = null;
  const down = (e: PointerEvent) => {
    cancelAnimationFrame(anim);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, az, el };
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    az = drag.az + (e.clientX - drag.x) * 0.5;
    el = Math.max(-90, Math.min(90, drag.el + (e.clientY - drag.y) * 0.5));
  };
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Hélice d’Euler', en: 'Euler helix' })}</span>
    <span class="spacer"></span>
    <label><input type="checkbox" bind:checked={showSum} /> {tr({ fr: 'Somme', en: 'Sum' })}</label>
  </header>
  <div class="body">
    <svg
      viewBox="0 0 {W} {H}"
      role="img"
      aria-label="Euler helix"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={() => (drag = null)}
    >
      <line x1={axes.t0[0]} y1={axes.t0[1]} x2={axes.t1[0]} y2={axes.t1[1]} class="axis" />
      <line x1={axes.t0[0]} y1={axes.t0[1]} x2={axes.re[0]} y2={axes.re[1]} class="axis" />
      <line x1={axes.t0[0]} y1={axes.t0[1]} x2={axes.im[0]} y2={axes.im[1]} class="axis" />
      <text x={axes.t1[0] + 4} y={axes.t1[1] - 4} class="lbl">t</text>
      <text x={axes.re[0] + 4} y={axes.re[1] + 12} class="lbl">Re</text>
      <text x={axes.im[0] + 4} y={axes.im[1] - 2} class="lbl">Im</text>

      <path d={ring} class="ring" />
      {#if pathS}<path d={pathS} class="h sum" data-term="vs" />{/if}
      <path d={path1} class="h" data-term="v1" />
      <line x1={now.axis[0]} y1={now.axis[1]} x2={now.tip[0]} y2={now.tip[1]} class="radius" />
      <circle cx={now.tip[0]} cy={now.tip[1]} r="5" class="dot" />
    </svg>
    <div class="views">
      {#each views as v (v.id)}
        <button class="btn" onclick={() => goTo(v)}>{tr(v.label)}</button>
      {/each}
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 250px;
    display: block;
    cursor: grab;
    touch-action: none;
  }
  svg:active {
    cursor: grabbing;
  }
  header label {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .axis {
    stroke: var(--faint);
    stroke-width: 1;
  }
  .lbl {
    fill: var(--muted);
    font-size: 12px;
    font-style: italic;
  }
  .h {
    fill: none;
    stroke: var(--c-v1);
    stroke-width: 2.2;
    color: var(--c-v1);
  }
  .h.sum {
    stroke: var(--c-vs);
    stroke-width: 1.6;
    stroke-dasharray: 5 4;
    color: var(--c-vs);
  }
  .ring {
    fill: none;
    stroke: var(--faint);
    stroke-dasharray: 2 3;
  }
  .radius {
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .dot {
    fill: var(--accent);
  }
  .views {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
  }
  .views .btn {
    font-size: 12px;
    padding: 2px 8px;
  }
</style>
