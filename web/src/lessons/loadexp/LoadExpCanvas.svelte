<script lang="ts">
  // A feeder bus with three kinds of consumers, and two bars: the active and
  // reactive power drawn now, against their values at 1 pu and 50 Hz.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const P = $derived(lab.at('P'));
  const Q = $derived(lab.at('Q'));
  const V = $derived(lab.at('V'));
  const f = $derived(lab.at('f'));
  const a = $derived(lab.params.alpha);
  // Which simple load the exponent is closest to.
  const kind = $derived(a < 0.5 ? { fr: 'proche de P constante', en: 'close to constant P' } : a < 1.5 ? { fr: 'proche de I constant', en: 'close to constant I' } : { fr: 'proche de Z constante', en: 'close to constant Z' });
  const bar = (x: number, ref: number) => Math.max(0, Math.min(1.3, x / ref)) * 120;
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 220" role="img" aria-label="Loads on a feeder">
      <circle cx="30" cy="60" r="16" class="src" />
      <path d="M21,60 c3,-8 5,-8 9,0 s5,8 9,0" class="sym" />
      <text x="30" y="94" class="v">{num(V, 3)} pu</text>
      <text x="30" y="108" class="v">{num(f, 4)} Hz</text>
      <line x1="46" y1="60" x2="90" y2="60" class="w" />
      <line x1="90" y1="30" x2="90" y2="190" class="bus" />
      {#each [{ y: 50, l: { fr: '⚙ moteurs', en: '⚙ motors' } }, { y: 110, l: { fr: '♨ chauffage', en: '♨ heating' } }, { y: 170, l: { fr: '🖥 électronique', en: '🖥 electronics' } }] as c (c.y)}
        <line x1="90" y1={c.y} x2="130" y2={c.y} class="w" />
        <path d="M130,{c.y} v14 m-7,-6 l7,9 l7,-9" class="load" />
        <text x="185" y={c.y + 12} class="lbl">{tr(c.l)}</text>
      {/each}
      <!-- P and Q bars, 120 px = 1 pu reference -->
      <g transform="translate(250,40)">
        <rect x="0" y="0" width="120" height="16" rx="3" class="track" />
        <rect x="0" y="0" width={bar(P, 1)} height="16" rx="3" class="bar" style="fill: var(--c-p)" />
        <line x1="120" y1="-4" x2="120" y2="20" class="thin" />
        <text x="60" y="34" class="v">P = {num(P, 4)} pu</text>
        <rect x="0" y="60" width="120" height="16" rx="3" class="track" />
        <rect x="0" y="60" width={bar(Q, 0.4)} height="16" rx="3" class="bar" />
        <line x1="120" y1="56" x2="120" y2="80" class="thin" />
        <text x="60" y="94" class="v">Q = {num(Q, 3)} pu</text>
        <text x="60" y="130" class="small">{tr({ fr: 'trait : valeur à 1 pu, 50 Hz', en: 'tick: value at 1 pu, 50 Hz' })}</text>
        <text x="60" y="150" class="small">α = {num(a, 3)} · {tr(kind)}</text>
      </g>
    </svg>
  </div>
</section>
