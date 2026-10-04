<script lang="ts">
  // The generator: rotor angle δ, excitation E, and the P and Q it sends to the
  // grid. In short-circuit mode, the fault at its terminals.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { SmInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as SmInfo);
  const sc = $derived(lab.params.mode === 1);
  const d = $derived((k.delta * Math.PI) / 180);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="mode">{sc ? tr({ fr: 'court-circuit triphasé', en: 'three-phase short circuit' }) : tr({ fr: 'régime établi', en: 'steady state' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="Synchronous generator">
      <!-- machine -->
      <circle cx="90" cy="105" r="62" class="stator" />
      <circle cx="90" cy="105" r="40" class="rotor" />
      {#if !sc}
        <line x1="90" y1="105" x2={90 + 36 * Math.cos(d)} y2={105 - 36 * Math.sin(d)} class="ax" />
        <line x1="90" y1="105" x2="130" y2="105" class="ref" />
        <text x="90" y="190" class="v">δ = {num(k.delta, 3)}°</text>
      {/if}
      <!-- excitation gauge -->
      <rect x="10" y="20" width="12" height="80" rx="4" class="track" />
      <rect x="10" y={100 - 80 * Math.min(1, lab.params.E / 2.8)} width="12" height={80 * Math.min(1, lab.params.E / 2.8)} rx="4" class="exc" />
      <text x="16" y="114" class="small">E</text>

      <!-- connection to the grid -->
      <line x1="152" y1="105" x2="340" y2="105" class="w" />
      <line x1="340" y1="70" x2="340" y2="140" class="bus" />
      <text x="360" y="110" class="small" text-anchor="start">∞</text>
      {#if sc}
        <path d="M200,80 l14,18 l-8,2 l14,22" class="fault" />
        <text x="215" y="150" class="warn-t">{tr({ fr: 'défaut aux bornes', en: 'fault at the terminals' })}</text>
      {:else}
        <g transform="translate(245,88)">
          <path d="M-40,0 H40 M30,-7 L42,0 L30,7" class="parrow" />
          <text x="0" y="-10" class="v">P = {num(k.P, 3)}</text>
        </g>
        <g transform="translate(245,128) scale({k.Q >= 0 ? 1 : -1},1)">
          <path d="M-40,0 H40 M30,-7 L42,0 L30,7" class="qarrow" />
        </g>
        <text x="245" y="150" class="v">Q = {num(k.Q, 3)}</text>
        <text x="245" y="168" class="small">
          {k.Q > 0.02 ? tr({ fr: 'surexcité : fournit du réactif', en: 'over-excited: exports reactive power' }) : k.Q < -0.02 ? tr({ fr: 'sous-excité : absorbe du réactif', en: 'under-excited: absorbs reactive power' }) : tr({ fr: 'facteur de puissance unitaire', en: 'unity power factor' })}
        </text>
        {#if !k.stable}<text x="245" y="200" class="warn-t">{tr({ fr: 'pas d’équilibre : perte de synchronisme', en: 'no equilibrium: loss of synchronism' })}</text>{/if}
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
  text {
    text-anchor: middle;
  }
  .mode {
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
    font-weight: 600;
  }
  .stator {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 2;
  }
  .rotor {
    fill: var(--panel);
    stroke: var(--c-L);
    stroke-width: 2.4;
  }
  .ax {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .ref {
    stroke: var(--c-S);
    stroke-dasharray: 4 3;
    stroke-width: 2;
  }
  .track {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .exc {
    fill: var(--c-L);
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2.4;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .parrow {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 3.5;
  }
  .qarrow {
    fill: none;
    stroke: var(--c-C);
    stroke-width: 3.5;
  }
  .fault {
    fill: none;
    stroke: #c0392b;
    stroke-width: 3.5;
  }
  .v {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
  }
  .small {
    fill: var(--muted);
    font-size: 10.5px;
  }
  .warn-t {
    fill: var(--warn);
    font-size: 11.5px;
    font-weight: 700;
  }
</style>
