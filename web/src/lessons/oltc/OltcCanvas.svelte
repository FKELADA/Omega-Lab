<script lang="ts">
  // Top: the regulating transformer, its tap position and the downstream voltage
  // against its dead band. Bottom left: two parallel lines, one with a phase
  // shifter. Bottom right: the vector-group clock.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { OLTC, PST, type OltcInfo } from '../../lib/models/module4b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as OltcInfo);
  const tap = $derived(Math.round(lab.at('tap')));
  const vlv = $derived(lab.at('vlv'));
  const half = $derived(lab.params.DB / 200);
  // Voltage gauge: 0.85 … 1.10 pu over 120 px.
  const gy = (v: number) => 120 - ((v - 0.85) / 0.25) * 100;
  const hand = (h: number, r: number): [number, number] => [r * Math.sin((h * Math.PI) / 6), -r * Math.cos((h * Math.PI) / 6)];
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if !lab.concealed && k.hunting}<span class="kit-warn">{tr({ fr: 'pompage', en: 'hunting' })}</span>{/if}
    {#if !lab.concealed && k.atLimit}<span class="kit-warn">{tr({ fr: 'régleur en butée', en: 'tap changer at its limit' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 250" role="img" aria-label="Regulating transformer">
      <!-- source, transformer with tap changer, load -->
      <circle cx="30" cy="60" r="16" class="src" />
      <path d="M21,60 c3,-8 5,-8 9,0 s5,8 9,0" class="sym" />
      <text x="30" y="92" class="v">{num(lab.at('vhv'), 3)}</text>
      <line x1="46" y1="60" x2="92" y2="60" class="w" />
      <circle cx="110" cy="60" r="18" class="coil" />
      <circle cx="132" cy="60" r="18" class="coil2" />
      <line x1="92" y1="88" x2="148" y2="30" class="w" />
      <path d="M148,30 l-9,2 l6,6 z" class="arrow" />
      <text x="121" y="102" class="lbl">{tr({ fr: 'prise', en: 'tap' })} n = {lab.concealed ? '?' : tap > 0 ? `+${tap}` : tap}</text>
      <line x1="150" y1="60" x2="210" y2="60" class="w" />
      <line x1="210" y1="36" x2="210" y2="84" class="bus" />
      <line x1="210" y1="60" x2="250" y2="60" class="w" />
      <path d="M250,60 v16 m-7,-7 l7,9 l7,-9" class="load" />
      <!-- gauge -->
      <g transform="translate(300,0)">
        <rect x="0" y="20" width="24" height="100" rx="3" class="track" />
        <rect x="0" y={gy(1 + half)} width="24" height={gy(1 - half) - gy(1 + half)} class="band" />
        {#if !lab.concealed}
          <line x1="-6" y1={gy(vlv)} x2="30" y2={gy(vlv)} class="w hot" />
          <text x="64" y={gy(vlv) + 4} class="v">{num(vlv, 4)}</text>
        {/if}
        <text x="12" y="134" class="small">V<tspan baseline-shift="sub" font-size="8">BT</tspan> (pu)</text>
        <text x="-14" y={gy(1) + 4} class="small">1</text>
      </g>
      <text x="200" y="128" class="small">±{OLTC.nMax} × {num(OLTC.step * 100, 3)} %</text>

      <!-- phase shifter on two parallel lines -->
      <line x1="20" y1="150" x2="20" y2="230" class="bus" />
      <line x1="230" y1="150" x2="230" y2="230" class="bus" />
      <line x1="20" y1="165" x2="90" y2="165" class="w" />
      <rect x="90" y="155" width="34" height="20" rx="4" class="box" />
      <text x="107" y="169" class="small">α</text>
      <line x1="124" y1="165" x2="230" y2="165" class="w" class:hot={k.P1 > PST.rating} />
      <line x1="20" y1="215" x2="230" y2="215" class="w" />
      <text x="170" y="158" class="v" class:bad={k.P1 > PST.rating}>P₁ = {num(k.P1, 3)}</text>
      <text x="125" y="208" class="v">P₂ = {num(k.P2, 3)}</text>
      <text x="125" y="244" class="small">α = {num(lab.params.alpha, 3)}° · {tr({ fr: 'limite', en: 'rating' })} P₁ ≤ {PST.rating}</text>

      <!-- vector group clock -->
      <g transform="translate(330,195)">
        <circle r="34" class="track" />
        {#each Array.from({ length: 12 }, (_, i) => i) as h (h)}
          <circle cx={hand(h, 29)[0]} cy={hand(h, 29)[1]} r="1.5" class="thin" />
        {/each}
        <line x1="0" y1="0" x2="0" y2="-26" class="coil" />
        <line x1="0" y1="0" x2={hand(k.group.h, 20)[0]} y2={hand(k.group.h, 20)[1]} class="coil2" />
        <text x="0" y="50" class="v">{k.group.name}</text>
      </g>
    </svg>
  </div>
</section>
