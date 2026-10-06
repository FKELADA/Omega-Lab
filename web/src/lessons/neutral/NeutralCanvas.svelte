<script lang="ts">
  // The MV busbar with its neutral earthing (nothing, a resistor or a Petersen coil),
  // the faulty feeder and the largest healthy feeder, each with its earth-fault relay.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { NEUTRAL, RELAY, type NeutralInfo } from '../../lib/models/module10';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as NeutralInfo);
  const reg = $derived(lab.params.regime);
  const relay = $derived(lab.params.relay === RELAY.watt ? 'W' : 'A');
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.healthyTrips}<span class="kit-warn">{tr({ fr: 'déclenchement intempestif du départ sain', en: 'healthy feeder trips wrongly' })}</span>
    {:else if !k.faultyTrips}<span class="kit-warn">{tr({ fr: 'défaut non vu', en: 'fault not seen' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 220" role="img" aria-label="Neutral earthing">
      <!-- transformer and neutral -->
      <circle cx="40" cy="60" r="14" class="coil" />
      <circle cx="40" cy="80" r="14" class="coil2" />
      <line x1="40" y1="94" x2="40" y2="118" class="w" />
      {#if reg === NEUTRAL.isolated}
        <text x="40" y="132" class="small">{tr({ fr: 'isolé', en: 'isolated' })}</text>
      {:else if reg === NEUTRAL.resistance}
        <rect x="33" y="118" width="14" height="30" class="x" />
        <text x="72" y="138" class="small">{num(lab.params.In, 3)} A</text>
      {:else}
        <path d="M40,118 a6,6 0 0 1 0,12 a6,6 0 0 1 0,12 a6,6 0 0 1 0,12" class="coil" />
        <text x="72" y="138" class="small">δ = {num(lab.params.detune, 2)} %</text>
      {/if}
      <line x1="30" y1="160" x2="50" y2="160" class="gnd" />
      <line x1="34" y1="165" x2="46" y2="165" class="gnd" />
      <line x1="54" y1="80" x2="110" y2="80" class="w" />
      <line x1="110" y1="30" x2="110" y2="190" class="bus" />
      <!-- faulty feeder -->
      <line x1="110" y1="60" x2="360" y2="60" class="w hot" />
      <rect x="125" y="48" width="22" height="24" rx="3" class="box" />
      <text x="136" y="64" class="small">{relay}</text>
      <text x="136" y="40" class={k.faultyTrips ? 'small ok' : 'small bad'}>{k.faultyTrips ? '✓ ' : '✗ '}{num(k.i0f, 3)} A</text>
      <text x="300" y="50" class="small bad">⚡ R<tspan baseline-shift="sub" font-size="7">d</tspan> = {num(lab.params.Rf, 3)} Ω</text>
      <line x1="300" y1="60" x2="300" y2="84" class="w hot" />
      <line x1="292" y1="86" x2="308" y2="86" class="gnd" />
      <text x="230" y="76" class="small">I<tspan baseline-shift="sub" font-size="7">d</tspan> = {num(k.ifA, 3)} A</text>
      <!-- healthy feeder -->
      <line x1="110" y1="150" x2="360" y2="150" class="w" />
      <rect x="125" y="138" width="22" height="24" rx="3" class="box" />
      <text x="136" y="154" class="small">{relay}</text>
      <text x="136" y="130" class={k.healthyTrips ? 'small bad' : 'small ok'}>{k.healthyTrips ? '⚠ ' : '✓ '}{num(k.i0h, 3)} A</text>
      {#each [190, 230, 270, 310, 350] as x (x)}
        <line x1={x} y1="150" x2={x} y2="168" class="thin" />
        <line x1={x - 5} y1="168" x2={x + 5} y2="168" class="cap" style="stroke-width: 2" />
      {/each}
      <text x="270" y="190" class="small">{tr({ fr: 'capacités du câble vers la terre', en: 'cable capacitance to earth' })}</text>
      <text x="230" y="212" class="small">{tr({ fr: 'seuil', en: 'threshold' })} I<tspan baseline-shift="sub" font-size="7">s0</tspan> = {num(lab.params.Is0, 3)} A · V<tspan baseline-shift="sub" font-size="7">max</tspan> = {num(k.vMax, 3)} E</text>
    </svg>
  </div>
</section>
