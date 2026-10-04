<script lang="ts">
  // Grid inverter → L1 → capacitor branch (Cf with damping resistor Rd) → L2 → grid.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { LCL, type LclInfo } from '../../lib/models/module6';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LclInfo);
  const hasC = $derived(lab.params.Cf > 0.05);
  const coil = (x: number, y: number) => `M${x},${y} c3,-9 9,-9 12,0 c3,-9 9,-9 12,0 c3,-9 9,-9 12,0 c3,-9 9,-9 12,0`;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Onduleur raccordé au réseau', en: 'Grid-connected inverter' })}</span>
    <span class="spacer"></span>
    <span class="kind">{hasC ? tr({ fr: 'filtre LCL', en: 'LCL filter' }) : tr({ fr: 'filtre L', en: 'L filter' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="LCL filter">
      <!-- inverter -->
      <rect x="14" y="50" width="56" height="60" rx="5" class="inv" />
      <text x="42" y="76" class="sym">=</text>
      <text x="42" y="96" class="sym">~</text>
      <text x="42" y="128" class="lbl">{LCL.Vdc} V · {num(lab.params.fs, 3)} kHz</text>
      <line x1="70" y1="80" x2="96" y2="80" class="w" />
      <path d={coil(96, 80)} class="ind" />
      <text x="120" y="62" class="lbl">L₁ = {num(lab.params.L1, 3)} mH</text>
      <line x1="144" y1="80" x2="236" y2="80" class="w" />
      {#if hasC}
        <line x1="190" y1="80" x2="190" y2="104" class="w" />
        <path d="M190,104 l-6,4 l12,6 l-12,6 l12,6 l-6,4" class="res" class:off={lab.params.Rd < 0.05} />
        <line x1="190" y1="130" x2="190" y2="140" class="w" />
        <line x1="176" y1="140" x2="204" y2="140" class="cap" /><line x1="176" y1="148" x2="204" y2="148" class="cap" />
        <line x1="190" y1="148" x2="190" y2="176" class="w" />
        <line x1="70" y1="176" x2="360" y2="176" class="w" />
        <text x="216" y="122" class="lbl" text-anchor="start">R<tspan baseline-shift="sub" font-size="8">d</tspan> = {num(lab.params.Rd, 3)} Ω</text>
        <text x="216" y="148" class="lbl" text-anchor="start">C<tspan baseline-shift="sub" font-size="8">f</tspan> = {num(lab.params.Cf, 3)} µF</text>
      {:else}
        <line x1="70" y1="176" x2="360" y2="176" class="w" />
      {/if}
      <path d={coil(236, 80)} class="ind" />
      <text x="260" y="62" class="lbl">L₂ = {num(lab.params.L2, 3)} mH</text>
      <line x1="284" y1="80" x2="342" y2="80" class="w" />
      <circle cx="360" cy="128" r="18" class="grid" />
      <path d="M350,128 c3,-8 6,-8 10,0 s6,8 10,0" class="gsym" />
      <line x1="342" y1="80" x2="360" y2="80" class="w" /><line x1="360" y1="80" x2="360" y2="110" class="w" />
      <line x1="360" y1="146" x2="360" y2="176" class="w" />
      <text x="360" y="102" class="lbl" text-anchor="start" dx="22">{LCL.Vg} V</text>
      <path d="M300,72 l10,8 l-10,8" class="arrow" />
      <text x="312" y="100" class="lbl">i<tspan baseline-shift="sub" font-size="8">g</tspan></text>
      {#if hasC && !lab.concealed}
        <text x="200" y="22" class="v">f<tspan baseline-shift="sub" font-size="8">rés</tspan> = {num(k.fres, 4)} Hz · R<tspan baseline-shift="sub" font-size="8">d,opt</tspan> ≈ {num(k.RdOpt, 3)} Ω</text>
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
  .kind {
    color: var(--c-p);
    font-weight: 700;
    text-transform: none;
  }
  .inv {
    fill: var(--panel-2);
    stroke: var(--c-i);
    stroke-width: 2;
  }
  .sym {
    fill: var(--c-i);
    font-size: 16px;
    font-weight: 700;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2.2;
  }
  .res {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .res.off {
    stroke-dasharray: 2 2;
    opacity: 0.5;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.6;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .gsym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .arrow {
    fill: none;
    stroke: var(--c-i);
    stroke-width: 2;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--c-p);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 700;
  }
</style>
