<script lang="ts">
  // Supply → feeder (with losses) → motor load, with a shunt capacitor bank.
  // The dial shows the power factor seen by the supply.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { R_LINE, type PowerInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as PowerInfo);
  // Dial: needle at the angle φ, ±90° full scale; lagging to the right.
  const needle = $derived(Math.max(-80, Math.min(80, k.phi)) * (Math.PI / 180));
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
  </header>
  <div class="body">
    <svg viewBox="-6 0 400 250" role="img" aria-label="Supply, feeder, motor and capacitor bank">
      <path class="wire" d="M40,108 V50 H90 M150,50 H360 V95 M360,165 V210 H40 V152 M270,50 V95 M270,165 V210" />

      <g class="el" data-term="S" style="color: var(--c-S)" role="presentation" onmouseenter={enter('S')} onmouseleave={leave}>
        <circle cx="40" cy="130" r="22" class="body-fill" />
        <circle cx="40" cy="130" r="22" />
        <path d="M28,130 c4,-12 8,-12 12,0 s8,12 12,0" />
        <text x="70" y="126" class="name" text-anchor="start">{si(lab.params.V, 'V')}</text>
        <text x="70" y="142" class="val" text-anchor="start">{lab.params.f} Hz</text>
      </g>

      <!-- feeder resistance -->
      <g class="feeder">
        <rect x="90" y="42" width="60" height="16" rx="3" />
        <text x="120" y="34" class="small">{tr({ fr: 'câble', en: 'cable' })} {num(R_LINE, 2)} Ω</text>
        <text x="120" y="76" class="loss">{tr({ fr: 'pertes', en: 'losses' })} {si(k.loss, 'W')}</text>
      </g>

      <!-- capacitor bank -->
      <g class="el" data-term="C" style="color: var(--c-C)" role="presentation" onmouseenter={enter('C')} onmouseleave={leave}>
        <line x1="270" y1="95" x2="270" y2="124" />
        <line x1="252" y1="124" x2="288" y2="124" />
        <line x1="252" y1="136" x2="288" y2="136" />
        <line x1="270" y1="136" x2="270" y2="165" />
        <text x="246" y="128" class="name" text-anchor="end">C</text>
        <text x="246" y="144" class="val" text-anchor="end">{si(lab.params.C, 'F')}</text>
        {#if k.QC > 0}<text x="246" y="160" class="val" text-anchor="end">−{si(k.QC, 'var')}</text>{/if}
      </g>

      <!-- motor -->
      <g class="el" data-term="L" style="color: var(--c-L)" role="presentation" onmouseenter={enter('L')} onmouseleave={leave}>
        <circle cx="360" cy="130" r="34" class="body-fill" />
        <circle cx="360" cy="130" r="34" />
        <text x="360" y="136" class="motor">M</text>
        <text x="360" y="186" class="val">{si(lab.params.P, 'W')}</text>
      </g>

      <!-- currents -->
      <g style="color: var(--c-i)" data-term="i">
        <text x="200" y="40" class="val strong">I = {si(cabs(k.I), 'A')}</text>
      </g>
      <text x="352" y="88" class="val" text-anchor="end">I<tspan baseline-shift="sub" font-size="8">M</tspan> = {si(cabs(k.Iload), 'A')}</text>

      <!-- power-factor dial -->
      <g transform="translate(160,170)">
        <path d="M-46,0 A46,46 0 0 1 46,0" class="dial" />
        <text x="-44" y="14" class="small" text-anchor="start">{tr({ fr: 'cap.', en: 'lead' })}</text>
        <text x="44" y="14" class="small" text-anchor="end">{tr({ fr: 'ind.', en: 'lag' })}</text>
        <line x1="0" y1="0" x2={40 * Math.sin(needle)} y2={-40 * Math.cos(needle)} class="needle" />
        <circle r="3" class="hub" />
        <text x="0" y="30" class="pf">cos φ = {num(k.pf, 3)}</text>
      </g>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
    max-height: 250px;
  }
  .wire {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
  }
  .el path,
  .el line,
  .el circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
  }
  .el .body-fill {
    fill: var(--panel);
    stroke: none;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .name {
    fill: currentColor;
    font-size: 13px;
    font-weight: 600;
  }
  .motor {
    fill: currentColor;
    font-size: 20px;
    font-weight: 700;
  }
  .val {
    fill: var(--muted);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .val.strong {
    fill: currentColor;
    font-weight: 600;
  }
  .feeder rect {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .small {
    fill: var(--faint);
    font-size: 10.5px;
  }
  .loss {
    fill: var(--warn);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .dial {
    fill: none;
    stroke: var(--line);
    stroke-width: 8;
  }
  .needle {
    stroke: var(--accent);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .hub {
    fill: var(--accent);
  }
  .pf {
    fill: var(--ink);
    font-size: 13px;
    font-weight: 600;
    font-family: var(--mono);
  }
</style>
