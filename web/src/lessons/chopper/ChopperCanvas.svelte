<script lang="ts">
  // Buck, boost or buck-boost at the instant under the cursor: the switch is
  // drawn open or closed, and the path carrying the inductor current is lit —
  // through the switch, through the diode, or nowhere (DCM).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { CHOPPER, CONVERTERS, type ChopperInfo } from '../../lib/models/module6';
  import { tr, type L } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ChopperInfo);
  const type = $derived(lab.params.type);
  const q = $derived(lab.at('q') > 0.5);
  const iL = $derived(lab.at('iL'));
  const diode = $derived(!q && iL > 1e-6);
  const names: L[] = [
    { fr: 'abaisseur (buck)', en: 'buck' },
    { fr: 'élévateur (boost)', en: 'boost' },
    { fr: 'inverseur (buck-boost)', en: 'buck-boost' },
  ];
  const state = $derived(q ? { fr: 'interrupteur fermé', en: 'switch on' } : diode ? { fr: 'diode passante', en: 'diode conducting' } : { fr: 'courant nul (DCM)', en: 'zero current (DCM)' });
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Hacheur', en: 'Chopper' })} {tr(names[type])}</span>
    <span class="spacer"></span>
    <span class="mode" class:dcm={k.dcm}>{k.dcm ? 'DCM' : 'CCM'}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="DC-DC converter">
      <!-- source -->
      <circle cx="36" cy="100" r="16" class="src" />
      <text x="36" y="96" class="pm">+</text>
      <text x="36" y="112" class="pm">−</text>
      <text x="36" y="136" class="lbl">{CHOPPER.Vin} V</text>
      <line x1="36" y1="84" x2="36" y2="40" class="w" />
      <line x1="36" y1="116" x2="36" y2="170" class="w" />
      <line x1="36" y1="170" x2="370" y2="170" class="w" class:on={!q || type === CONVERTERS.buck} />

      {#if type === CONVERTERS.buck}
        <!-- switch in series, diode to ground, then L -->
        <line x1="36" y1="40" x2="90" y2="40" class="w" class:on={q} />
        <g class="sw" class:on={q}>
          <circle cx="92" cy="40" r="3" /><circle cx="128" cy="40" r="3" />
          <line x1="92" y1="40" x2={q ? 128 : 124} y2={q ? 40 : 26} />
        </g>
        <line x1="130" y1="40" x2="170" y2="40" class="w" class:on={q || diode} />
        <line x1="150" y1="40" x2="150" y2="170" class="w" class:on={diode} />
        <path d="M142,112 h16 M142,112 l8,-12 l8,12 z" class="diode" class:on={diode} />
        <path d="M170,40 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0" class="ind" class:on={q || diode} />
        <text x="202" y="22" class="lbl">L</text>
        <line x1="234" y1="40" x2="370" y2="40" class="w" class:on={q || diode} />
      {:else}
        <!-- L first; switch to ground (boost) or switch in series (buck-boost) -->
        {#if type === CONVERTERS.boost}
          <path d="M36,40 h30 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0 c4,-12 12,-12 16,0" class="ind" class:on={q || diode} />
          <text x="98" y="22" class="lbl">L</text>
          <line x1="130" y1="40" x2="170" y2="40" class="w" class:on={q || diode} />
          <line x1="150" y1="40" x2="150" y2="84" class="w" class:on={q} />
          <g class="sw" class:on={q}>
            <circle cx="150" cy="86" r="3" /><circle cx="150" cy="124" r="3" />
            <line x1="150" y1="86" x2={q ? 150 : 164} y2={q ? 124 : 120} />
          </g>
          <line x1="150" y1="126" x2="150" y2="170" class="w" class:on={q} />
          <path d="M172,32 v16 M172,40 l-12,-8 v16 z" class="diode" class:on={diode} transform="rotate(180 166 40)" />
          <line x1="180" y1="40" x2="370" y2="40" class="w" class:on={diode} />
        {:else}
          <line x1="36" y1="40" x2="90" y2="40" class="w" class:on={q} />
          <g class="sw" class:on={q}>
            <circle cx="92" cy="40" r="3" /><circle cx="128" cy="40" r="3" />
            <line x1="92" y1="40" x2={q ? 128 : 124} y2={q ? 40 : 26} />
          </g>
          <line x1="130" y1="40" x2="190" y2="40" class="w" class:on={q || diode} />
          <path d="M150,40 v10 c12,4 12,12 0,16 c12,4 12,12 0,16 c12,4 12,12 0,16 c12,4 12,12 0,16 v56" class="ind" class:on={q || diode} />
          <text x="176" y="100" class="lbl">L</text>
          <path d="M190,32 v16 M190,40 l12,-8 v16 z" class="diode" class:on={diode} transform="rotate(180 196 40)" />
          <line x1="202" y1="40" x2="370" y2="40" class="w" class:on={diode} />
        {/if}
      {/if}

      <!-- output capacitor and load -->
      <line x1="270" y1="40" x2="270" y2="96" class="w" />
      <line x1="256" y1="96" x2="284" y2="96" class="cap" /><line x1="256" y1="106" x2="284" y2="106" class="cap" />
      <line x1="270" y1="106" x2="270" y2="170" class="w" />
      <text x="292" y="104" class="lbl" text-anchor="start">C</text>
      <rect x="360" y="80" width="20" height="44" rx="3" class="load" />
      <line x1="370" y1="40" x2="370" y2="80" class="w" /><line x1="370" y1="124" x2="370" y2="170" class="w" />
      <text x="392" y="106" class="lbl" text-anchor="end">R</text>

      {#if !lab.concealed}
        <text x="320" y="62" class="v">{type === CONVERTERS.buckboost ? '−' : ''}{num(k.Vout, 3)} V</text>
        <text x="200" y="196" class="state">{tr(state)} · i<tspan baseline-shift="sub" font-size="8">L</tspan> = {num(iL, 3)} A</text>
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
  .mode {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .mode.dcm {
    color: var(--warn);
  }
  .src {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .pm {
    fill: var(--c-S);
    font-size: 11px;
    font-weight: 700;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.on,
  .ind.on {
    stroke: var(--c-i);
    stroke-width: 3;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2.2;
  }
  .sw circle {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .sw line {
    stroke: var(--ink);
    stroke-width: 2.4;
  }
  .sw.on line {
    stroke: var(--c-i);
  }
  .diode {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.8;
  }
  .diode.on {
    fill: var(--c-i);
    stroke: var(--c-i);
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.6;
  }
  .load {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .lbl {
    fill: var(--muted);
    font-size: 11px;
    font-style: italic;
  }
  .v {
    fill: var(--c-C);
    font-size: 13px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .state {
    fill: var(--ink);
    font-size: 11px;
  }
</style>
