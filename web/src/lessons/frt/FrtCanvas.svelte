<script lang="ts">
  // Grid-code test bench: a voltage-dip generator in front of the plant. The
  // plant either stays connected and injects reactive current, or trips.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FRT, PROTECTION, type FrtInfo } from '../../lib/models/module7c';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as FrtInfo);
  const V = $derived(lab.at('V'));
  const trippedNow = $derived(k.tripped && k.tTrip !== null && lab.t >= k.tTrip);
  const iq = $derived(lab.at('iq'));
  const ip = $derived(lab.at('ip'));
  const bar = (v: number) => Math.max(0, Math.min(1.2, isFinite(v) ? v : 0)) * 70;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Banc d’essai de tenue aux creux', en: 'Fault-ride-through test bench' })}</span>
    <span class="spacer"></span>
    {#if trippedNow}<span class="warn">{tr({ fr: 'déclenchée', en: 'tripped' })}</span>
    {:else if lab.t >= FRT.t0}<span class="ok">{tr({ fr: 'reste connectée', en: 'stays connected' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="FRT test bench">
      <!-- grid and dip generator -->
      <circle cx="34" cy="80" r="18" class="grid" />
      <path d="M24,80 c3,-8 6,-8 10,0 s6,8 10,0" class="gs" />
      <line x1="52" y1="80" x2="80" y2="80" class="w" />
      <rect x="80" y="62" width="64" height="36" rx="5" class="gen" />
      <text x="112" y="78" class="g1">{tr({ fr: 'générateur', en: 'dip' })}</text>
      <text x="112" y="90" class="g1">{tr({ fr: 'de creux', en: 'generator' })}</text>
      <line x1="144" y1="80" x2="196" y2="80" class="w" />
      <line x1="196" y1="60" x2="196" y2="100" class="bus" />
      <text x="196" y="52" class="lbl">PCC</text>
      <!-- breaker -->
      <line x1="196" y1="80" x2="222" y2="80" class="w" />
      <g class="brk" class:open={trippedNow}>
        <circle cx="224" cy="80" r="2.5" /><circle cx="250" cy="80" r="2.5" />
        <line x1="224" y1="80" x2={trippedNow ? 246 : 250} y2={trippedNow ? 64 : 80} />
      </g>
      <line x1="252" y1="80" x2="276" y2="80" class="w" />
      <!-- plant -->
      <rect x="276" y="58" width="64" height="44" rx="5" class="plant" class:off={trippedNow} />
      <text x="308" y="78" class="g1">{tr({ fr: 'parc', en: 'wind/PV' })}</text>
      <text x="308" y="91" class="g1">{tr({ fr: 'éolien/PV', en: 'plant' })}</text>
      <!-- voltage gauge -->
      {#if !lab.concealed}
        <rect x="186" y="118" width="20" height="70" class="track" />
        <rect x="186" y={188 - bar(V)} width="20" height={bar(V)} class="vbar" class:low={V < 0.9} />
        <text x="196" y="202" class="ro">{num(V, 3)} pu</text>
        <!-- currents -->
        <rect x="290" y="118" width="16" height="70" class="track" />
        <rect x="290" y={188 - bar(iq)} width="16" height={bar(iq)} class="iq" />
        <rect x="312" y="118" width="16" height="70" class="track" />
        <rect x="312" y={188 - bar(ip)} width="16" height={bar(ip)} class="ip" />
        <text x="298" y="202" class="lbl">i<tspan baseline-shift="sub" font-size="7">q</tspan></text>
        <text x="320" y="202" class="lbl">i<tspan baseline-shift="sub" font-size="7">p</tspan></text>
        <text x="352" y="140" class="ro" text-anchor="start">{num(iq, 2)}</text>
        <text x="352" y="156" class="ro" text-anchor="start">{num(ip, 2)}</text>
      {/if}
      <text x="60" y="150" class="lbl" text-anchor="start">{tr({ fr: 'creux', en: 'dip' })} {num(lab.params.Vres, 3)} pu · {num(lab.params.dur * 1000, 3)} ms</text>
      <text x="60" y="166" class="lbl" text-anchor="start">K = {num(lab.params.K, 3)} · {lab.params.prot === PROTECTION.legacy ? tr({ fr: 'protection ancienne', en: 'legacy protection' }) : tr({ fr: 'réglage conforme', en: 'compliant setting' })}</text>
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
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .gs {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .gen {
    fill: var(--panel-2);
    stroke: var(--warn);
    stroke-width: 2;
  }
  .plant {
    fill: var(--panel-2);
    stroke: var(--c-i);
    stroke-width: 2;
  }
  .plant.off {
    stroke: var(--line);
    opacity: 0.5;
  }
  .g1 {
    fill: var(--ink);
    font-size: 9.5px;
  }
  .brk circle {
    fill: var(--panel);
    stroke: var(--ink);
  }
  .brk line {
    stroke: var(--ink);
    stroke-width: 2.4;
  }
  .brk.open line {
    stroke: var(--warn);
  }
  .track {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .vbar {
    fill: var(--c-S);
  }
  .vbar.low {
    fill: var(--warn);
  }
  .iq {
    fill: var(--c-C);
  }
  .ip {
    fill: var(--c-p);
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .ro {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
</style>
