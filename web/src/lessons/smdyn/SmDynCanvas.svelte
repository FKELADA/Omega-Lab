<script lang="ts">
  // Turbine → generator → step-up transformer → two lines to the grid (one trips),
  // with the two control loops drawn around the machine: the governor on the
  // shaft, the AVR on the field. Islanded test: the machine feeds its load alone.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { ORDER, SCEN, SMD, type SmDynInfo } from '../../lib/models/module4b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as SmDynInfo);
  const grid = $derived(lab.params.scen === SCEN.fault);
  const t = $derived(lab.t);
  const faulted = $derived(grid && t >= SMD.tF && t < SMD.tF + SMD.dF);
  const tripped = $derived(grid && t >= SMD.tF + SMD.dF);
  const avr = $derived(grid && lab.params.order === ORDER.oneAxis && lab.params.KA > 0);
  // The rotor turns with the angle (grid) or drifts with the frequency error (islanded).
  const angle = $derived(grid ? lab.at('delta') : 0);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if !lab.concealed && grid && k.lost}<span class="kit-warn">{tr({ fr: 'perte de synchronisme', en: 'loss of synchronism' })}</span>
    {:else if !lab.concealed && grid && k.growing}<span class="kit-warn">{tr({ fr: 'oscillations croissantes', en: 'growing oscillations' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 230" role="img" aria-label="Generator with its controls">
      <!-- turbine and shaft -->
      <path d="M20,90 l30,-18 v36 z" class="box" />
      <text x="34" y="128" class="small">{tr({ fr: 'turbine', en: 'turbine' })}</text>
      <line x1="50" y1="90" x2="82" y2="90" class="w" />
      <!-- generator with rotor angle -->
      <circle cx="110" cy="90" r="28" class="src" />
      <g transform="rotate({-angle} 110 90)">
        <rect x="104" y="68" width="12" height="44" rx="5" class="x" />
      </g>
      <text x="110" y="136" class="v">{lab.concealed ? 'f = ?' : `f = ${num(lab.at('f'), 4)} Hz`}</text>
      <!-- governor loop -->
      <rect x="40" y="16" width="70" height="22" rx="4" class="box" />
      <text x="75" y="31" class="small">{tr({ fr: 'régulateur de vitesse', en: 'governor' })}</text>
      <path d="M110,62 V38 M40,27 H30 V72" class="thin" />
      <text x="75" y="52" class="small">s = {num(lab.params.R, 2)} %</text>
      <!-- AVR loop -->
      <rect x="140" y="16" width="70" height="22" rx="4" class="box" class:dim={!avr} />
      <text x="175" y="31" class="small">AVR · K<tspan baseline-shift="sub" font-size="8">A</tspan> = {num(lab.params.KA, 3)}</text>
      <path d="M175,38 V60 M128,72 L150,52" class="thin" class:dim={!avr} />
      <!-- terminal and transformer -->
      <line x1="138" y1="90" x2="170" y2="90" class="w" />
      <line x1="170" y1="66" x2="170" y2="114" class="bus" />
      <text x="170" y="60" class="v">V<tspan baseline-shift="sub" font-size="8">t</tspan> = {num(lab.at('Vt'), 3)}</text>
      {#if grid}
        <line x1="170" y1="90" x2="196" y2="90" class="w" />
        <circle cx="206" cy="90" r="10" class="coil" />
        <circle cx="220" cy="90" r="10" class="coil2" />
        <line x1="230" y1="90" x2="250" y2="90" class="w" />
        <line x1="250" y1="66" x2="250" y2="114" class="bus" />
        <!-- two lines -->
        <path d="M250,76 H350" class="w" />
        <path d="M250,104 H290" class="w" />
        <line x1="290" y1="104" x2={tripped ? 304 : 310} y2={tripped ? 94 : 104} class={tripped ? 'open' : 'closed'} />
        <path d="M310,104 H350" class="w" />
        <line x1="350" y1="66" x2="350" y2="114" class="bus" />
        <text x="372" y="94" class="v">∞</text>
        <text x="300" y="70" class="small">X<tspan baseline-shift="sub" font-size="8">e</tspan> = {num(lab.params.Xe, 2)}{tripped ? ` → ${num(lab.params.Xe + SMD.dXe, 2)}` : ''}</text>
        {#if faulted}<text x="300" y="132" class="big bad">⚡ {tr({ fr: 'défaut', en: 'fault' })}</text>{/if}
        <text x="300" y="160" class="small">δ = {num(lab.at('delta'), 3)}° · E<tspan baseline-shift="sub" font-size="8">fd</tspan> = {num(lab.at('Efd'), 3)}</text>
      {:else}
        <line x1="170" y1="90" x2="240" y2="90" class="w" />
        <path d="M240,90 v18 m-8,-8 l8,10 l8,-10" class="load" />
        <text x="240" y="140" class="v">P = {num(lab.at('Pe'), 3)} pu</text>
        <text x="300" y="70" class="small">{tr({ fr: 'îloté : seule machine', en: 'islanded: the only machine' })}</text>
        <text x="300" y="160" class="small">P<tspan baseline-shift="sub" font-size="8">m</tspan> = {num(lab.at('Pm'), 3)} · Δf<tspan baseline-shift="sub" font-size="8">∞</tspan> = {num(k.fss - 50, 3)} Hz</text>
      {/if}
      <text x="200" y="210" class="small">
        {lab.params.order === ORDER.classical ? tr({ fr: 'modèle classique : E′ constant derrière X′d', en: 'classical model: constant E′ behind X′d' }) : tr({ fr: 'modèle à un axe : E′q suit le circuit d’excitation', en: 'one-axis model: E′q follows the field circuit' })}
      </text>
    </svg>
  </div>
</section>
