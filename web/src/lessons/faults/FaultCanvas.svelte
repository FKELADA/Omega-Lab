<script lang="ts">
  // Generator → Δ/Y step-up transformer (neutral solidly earthed, through a
  // resistor, or isolated) → 100 km line, with the fault drawn where it is.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { FAULT, FAULT_TYPES, GROUNDING, type FaultInfo } from '../../lib/models/module5';
  import { S, tr, type L } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as FaultInfo);
  const faulted = $derived(lab.t >= FAULT.tFault);
  const x0 = 210, x1 = 370;
  const fx = $derived(x0 + ((x1 - x0) * lab.params.km) / FAULT.lineKm);
  const names: L[] = [
    { fr: 'triphasé', en: 'three-phase' },
    { fr: 'phase–terre', en: 'phase-to-ground' },
    { fr: 'biphasé', en: 'phase-to-phase' },
    { fr: 'biphasé–terre', en: 'double phase-to-ground' },
  ];
  const touchesGround = $derived(lab.params.type === FAULT_TYPES.slg || lab.params.type === FAULT_TYPES.llg);
  const phases = ['a', 'b', 'c'];
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="kind" class:on={faulted}>{tr({ fr: 'défaut', en: 'fault' })} {tr(names[lab.params.type])}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" text-anchor="middle" role="img" aria-label="Fault on a line">
      <!-- generator -->
      <circle cx="34" cy="70" r="17" class="gen" />
      <path d="M25,70 c3,-8 6,-8 9,0 s6,8 9,0" class="sym" />
      <text x="34" y="104" class="lbl">X″d = {num(FAULT.Xg1, 2)}</text>
      <line x1="51" y1="70" x2="92" y2="70" class="w" />
      <!-- transformer: Δ (generator side) / Y (line side) -->
      <circle cx="108" cy="70" r="16" class="tr" />
      <circle cx="128" cy="70" r="16" class="tr" />
      <path d="M101,76 l7,-12 l7,12 z" class="wind" />
      <path d="M128,70 v-8 M128,70 l-7,5 M128,70 l7,5" class="wind" />
      <text x="118" y="104" class="lbl">Δ / Y · X = {num(FAULT.Xt, 2)}</text>
      <!-- neutral -->
      <line x1="128" y1="86" x2="128" y2="120" class="w" />
      {#if lab.params.ground === GROUNDING.solid}
        <path d="M116,120 h24 M120,126 h16 M124,132 h8" class="earth" />
      {:else if lab.params.ground === GROUNDING.resistance}
        <path d="M128,120 l-6,4 l12,6 l-12,6 l12,6 l-6,4" class="res" />
        <path d="M116,150 h24 M120,156 h16 M124,162 h8" class="earth" />
        <text x="152" y="140" class="lbl" text-anchor="start">R<tspan baseline-shift="sub" font-size="8">n</tspan></text>
      {:else}
        <circle cx="128" cy="122" r="3" class="open" />
        <text x="140" y="125" class="lbl" text-anchor="start">{tr({ fr: 'neutre isolé', en: 'isolated neutral' })}</text>
      {/if}
      <line x1="144" y1="70" x2={x0} y2="70" class="w" />
      <line x1={x0} y1="48" x2={x0} y2="92" class="bus" />
      <!-- line with km ticks -->
      <line x1={x0} y1="70" x2={x1} y2="70" class="w line" />
      {#each [0, 25, 50, 75, 100] as km (km)}
        <line x1={x0 + ((x1 - x0) * km) / 100} y1="74" x2={x0 + ((x1 - x0) * km) / 100} y2="80" class="tick" />
        <text x={x0 + ((x1 - x0) * km) / 100} y="92" class="km">{km}</text>
      {/each}
      <text x={(x0 + x1) / 2} y="104" class="lbl">km · Z₁ = {num(cabs(FAULT.Z1L), 2)} pu · Z₀ = {num(cabs(FAULT.Z0L), 2)} pu</text>
      <!-- fault -->
      <path d="M{fx + 4},{70 - 34} l-9,14 h8 l-9,16" class="bolt" class:on={faulted} />
      {#if touchesGround}
        <path d="M{fx},{70} v10 M{fx - 8},{80} h16 M{fx - 5},{84} h10" class="earth small" />
      {/if}
      {#if lab.params.Rf > 0.005}
        <text x={fx} y="30" class="lbl">R<tspan baseline-shift="sub" font-size="8">f</tspan> = {num(lab.params.Rf, 2)}</text>
      {/if}
      <!-- currents -->
      {#if !lab.concealed}
        {#each phases as ph, j (ph)}
          <text x="214" y={140 + 18 * j} class="cur" style="fill: var(--c-{ph})" text-anchor="start">
            I<tspan baseline-shift="sub" font-size="9">{ph}</tspan> = {num(faulted ? cabs(k.Iabc[j]) : FAULT.Ipre, 3)} pu
          </text>
        {/each}
        <text x="34" y="150" class="v" text-anchor="start">S<tspan baseline-shift="sub" font-size="8">cc</tspan> = {num(k.Ssc, 3)} MVA</text>
        <text x="34" y="168" class="v" text-anchor="start">I<tspan baseline-shift="sub" font-size="8">cc</tspan> = {num((k.I3ph * FAULT.Sbase) / (Math.sqrt(3) * FAULT.kV), 3)} kA</text>
        <text x="34" y="186" class="v" text-anchor="start">X/R = {num(k.XR, 3)}</text>
      {/if}
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
    display: block;
  }
  .kind {
    color: var(--muted);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .kind.on {
    color: var(--warn);
  }
  .gen {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2.2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .tr {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .wind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 1.5;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.line {
    stroke: var(--c-C);
    stroke-width: 3;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .tick {
    stroke: var(--muted);
    stroke-width: 1;
  }
  .km {
    fill: var(--muted);
    font-size: 9px;
  }
  .earth {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
  }
  .earth.small {
    stroke-width: 1.5;
  }
  .res {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .open {
    fill: var(--panel);
    stroke: var(--warn);
    stroke-width: 2;
  }
  .bolt {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .bolt.on {
    stroke: var(--warn);
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .cur {
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
</style>
