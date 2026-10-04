<script lang="ts">
  // A grid-following plant (current loop + PLL) feeding a Thevenin grid whose
  // reactance grows as the SCR falls. The PLL reads the PCC voltage, which the
  // plant's own current shifts: the extra feedback path is drawn explicitly.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { CdsInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as CdsInfo);
  // Line length on screen grows with Xg = 1/SCR.
  const len = $derived(60 + 90 * Math.min(1, (1 / lab.params.SCR - 0.1) / 0.73));
  const xg = $derived(250 - len / 2);
  const weak = $derived(lab.params.SCR < 3);
  const P = $derived(lab.at('P'));
  const v = $derived(lab.at('v'));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Centrale suiveuse sur réseau faible', en: 'Grid-following plant on a weak grid' })}</span>
    <span class="spacer"></span>
    <span class:warn={!k.stable} class:ok={k.stable}>{k.stable ? tr({ fr: 'stable', en: 'stable' }) : tr({ fr: 'instable', en: 'unstable' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="Grid-following plant on a weak grid">
      <defs>
        <marker id="cds-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="ah" /></marker>
      </defs>
      <!-- plant -->
      <rect x="14" y="50" width="96" height="80" rx="6" class="plant" />
      <text x="62" y="66" class="lbl">{tr({ fr: 'onduleur', en: 'inverter' })}</text>
      <rect x="24" y="74" width="76" height="20" rx="3" class="blk" />
      <text x="62" y="88" class="tf">{tr({ fr: 'courant', en: 'current' })} 500 Hz</text>
      <rect x="24" y="100" width="76" height="22" rx="3" class="blk pll" />
      <text x="62" y="115" class="tf">PLL {num(lab.params.fpll, 3)} Hz</text>
      <line x1="110" y1="90" x2="150" y2="90" class="w" />
      <!-- PCC -->
      <line x1="150" y1="66" x2="150" y2="114" class="bus" />
      <text x="150" y="60" class="lbl">PCC</text>
      {#if !lab.concealed}<text x="150" y="46" class="ro">|v| = {isFinite(v) ? num(v, 3) : '—'}</text>{/if}
      <!-- feedback: PLL reads the PCC voltage -->
      <path d="M150,114 V150 H62 V122" class="fb" marker-end="url(#cds-arr)" />
      <text x="106" y="162" class="lbl">{tr({ fr: 'la PLL lit v_PCC = v_g + Z_g·i', en: 'the PLL reads v_PCC = v_g + Z_g·i' })}</text>
      <!-- grid impedance -->
      <line x1="150" y1="90" x2={xg} y2="90" class="w" />
      <rect x={xg} y="80" width={len} height="20" rx="3" class="z" class:weak />
      <text x="250" y="94" class="tf">X<tspan baseline-shift="sub" font-size="6">g</tspan> = {num(1 / lab.params.SCR, 3)} pu</text>
      <line x1={xg + len} y1="90" x2="350" y2="90" class="w" />
      <text x="250" y="72" class="lbl">SCR = {num(lab.params.SCR, 3)}{weak ? tr({ fr: ' (faible)', en: ' (weak)' }) : ''}</text>
      <!-- grid source -->
      <circle cx="366" cy="90" r="16" class="grid" />
      <path d="M357,90 c3,-7 6,-7 9,0 s6,7 9,0" class="sym" />
      <text x="366" y="124" class="lbl">{tr({ fr: 'réseau', en: 'grid' })}</text>
      {#if !lab.concealed}
        <text x="250" y="124" class="ro">P = {isFinite(P) ? num(P, 3) : '—'} pu</text>
        {#if k.critical}<text x="250" y="186" class="lbl">{tr({ fr: 'mode critique', en: 'critical mode' })} : σ = {num(k.critical.re, 3)} 1/s, {num(Math.abs(k.critical.im) / (2 * Math.PI), 3)} Hz</text>{/if}
      {/if}
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
    display: block;
  }
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .ok {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .plant {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 1.8;
  }
  .blk {
    fill: var(--panel);
    stroke: var(--c-i);
    stroke-width: 1.2;
  }
  .blk.pll {
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .fb {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.4;
    stroke-dasharray: 4 3;
  }
  .ah {
    fill: var(--c-S);
  }
  .z {
    fill: var(--panel);
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .z.weak {
    stroke-width: 3;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .lbl {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .tf {
    fill: var(--ink);
    font-size: 9px;
    font-family: var(--mono);
  }
  .ro {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
</style>
