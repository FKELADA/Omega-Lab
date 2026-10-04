<script lang="ts">
  // The space-vector hexagon: the six active vectors (and the two zero vectors at
  // the centre), the circle reachable without distortion, the reference vector
  // at the cursor with its sector and SVPWM dwell times, and the vector applied.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { carrier, modulating, PWM, svDwell } from '../../lib/models/module6';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const W = 300, H = 230, cx = 150, cy = 112;
  const R = 92; // |V_k| = 2/3·Vdc
  const scale = R / ((2 / 3) * PWM.Vdc);
  const P = (ang: number, r: number) => [cx + r * Math.cos(ang), cy - r * Math.sin(ang)];
  const verts = Array.from({ length: 6 }, (_, k) => P((k * Math.PI) / 3, R));
  const codes = ['100', '110', '010', '011', '001', '101'];
  const th = $derived(2 * Math.PI * PWM.f1 * lab.t);
  // va = m·sin θ, so the αβ reference points at θ − 90°.
  const phi = $derived(th - Math.PI / 2);
  const dw = $derived(svDwell(lab.params.m, phi));
  const ref = $derived(P(phi, dw.mag * scale));
  const c = $derived(carrier(th, lab.params.mf));
  const code = $derived([0, 1, 2].map((j) => (modulating(lab.params.m, lab.params.method, th, j) >= c ? 1 : 0)).join(''));
  const applied = $derived(codes.indexOf(code));
  const inside = $derived(dw.mag <= PWM.Vdc / Math.sqrt(3) + 1e-6);
  const s0 = $derived(P((dw.sector * Math.PI) / 3, R));
  const s1 = $derived(P(((dw.sector + 1) * Math.PI) / 3, R));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Hexagone des vecteurs d’espace', en: 'Space-vector hexagon' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 {W} {H}" text-anchor="middle" role="img" aria-label="Space-vector hexagon">
      <path d="M{cx},{cy} L{s0[0]},{s0[1]} L{s1[0]},{s1[1]} Z" class="sector" />
      <polygon points={verts.map((v) => v.join(',')).join(' ')} class="hex" />
      <circle {cx} {cy} r={(PWM.Vdc / Math.sqrt(3)) * scale} class="lin" />
      <circle {cx} {cy} r={dw.mag * scale} class="locus" class:out={!inside} />
      {#each verts as v, k (k)}
        <line x1={cx} y1={cy} x2={v[0]} y2={v[1]} class="vk" class:on={k === applied} />
        <text x={cx + (v[0] - cx) * 1.17} y={cy + (v[1] - cy) * 1.17 + 3} class="code" class:on={k === applied}>V{k + 1} {codes[k]}</text>
      {/each}
      <circle {cx} {cy} r="4" class="zero" class:on={applied < 0} />
      {#if !lab.concealed}
        <line x1={cx} y1={cy} x2={ref[0]} y2={ref[1]} class="ref" />
        <circle cx={ref[0]} cy={ref[1]} r="3.5" class="refdot" />
      {/if}
    </svg>
    <p class="note">
      {tr({ fr: 'Secteur', en: 'Sector' })} {dw.sector + 1} · d₁ = {num(Math.max(0, dw.d1), 2)} · d₂ = {num(Math.max(0, dw.d2), 2)} · d₀ = {num(dw.d0, 2)}
      {#if !inside}<span class="warn"> · {tr({ fr: 'hors du cercle inscrit : surmodulation', en: 'outside the inscribed circle: overmodulation' })}</span>{/if}
    </p>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
    display: block;
  }
  .sector {
    fill: var(--accent-soft);
  }
  .hex {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .lin {
    fill: none;
    stroke: var(--good);
    stroke-dasharray: 4 3;
  }
  .locus {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  .locus.out {
    stroke: var(--warn);
  }
  .vk {
    stroke: var(--muted);
    stroke-width: 1.4;
  }
  .vk.on {
    stroke: var(--c-i);
    stroke-width: 3.5;
  }
  .code {
    fill: var(--muted);
    font-size: 9.5px;
    font-family: var(--mono);
  }
  .code.on {
    fill: var(--c-i);
    font-weight: 700;
  }
  .zero {
    fill: var(--panel);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .zero.on {
    fill: var(--c-i);
    stroke: var(--c-i);
  }
  .ref {
    stroke: var(--c-p);
    stroke-width: 2.5;
  }
  .refdot {
    fill: var(--c-p);
  }
  .note {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--muted);
    font-family: var(--mono);
  }
  .warn {
    color: var(--warn);
    font-family: var(--font);
  }
</style>
