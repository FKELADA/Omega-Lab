<script lang="ts">
  // A single-phase view of the transformer being energised: the core turns red
  // when the flux passes the saturation knee, and the winding current is shown live.
  // The clock shows the Dyn11 vector group: LV leads HV by 30°.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { TrafoInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as TrafoInfo);
  const psi = $derived(lab.at('psi'));
  const sat = $derived(Math.abs(psi) > lab.params.psiSat);
  const heat = $derived(Math.min(1, Math.abs(lab.at('i')) / Math.max(1e-6, k.iPeak)));
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if sat && !lab.concealed}<span class="warn">{tr({ fr: 'noyau saturé', en: 'core saturated' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="Transformer">
      <!-- core -->
      <rect x="120" y="30" width="160" height="150" rx="6" class="core" class:sat={sat && !lab.concealed} />
      <rect x="150" y="60" width="100" height="90" rx="4" class="win" />
      <!-- windings -->
      {#each [0, 1, 2, 3, 4] as j (j)}
        <ellipse cx="135" cy={70 + j * 18} rx="22" ry="7" class="coil hv" />
        <ellipse cx="265" cy={70 + j * 18} rx="22" ry="7" class="coil lv" />
      {/each}
      <!-- source and switch -->
      <circle cx="40" cy="105" r="18" class="src" />
      <path d="M30,105 c3,-9 6,-9 10,0 s6,9 10,0" class="sym" />
      <path d="M58,105 H80 M100,98 H113 M58,105" class="w" />
      <line x1="80" y1="105" x2="100" y2="98" class="w" />
      <text x="90" y="88" class="small">t = 0</text>
      <!-- current bar -->
      <rect x="20" y="150" width="70" height="10" rx="3" class="track" />
      <rect x="20" y="150" width={70 * heat} height="10" rx="3" class="ibar" />
      <text x="55" y="176" class="v">i = {lab.concealed ? '?' : `${num(lab.at('i'), 3)} pu`}</text>
      <text x="160" y="200" class="v">ψ = {num(psi, 3)} pu · ψ<tspan baseline-shift="sub" font-size="8">sat</tspan> = {num(lab.params.psiSat, 3)}</text>
      <text x="330" y="215" class="small">{tr({ fr: 'secondaire ouvert', en: 'secondary open' })}</text>

      <!-- vector group clock -->
      <g transform="translate(350,60)">
        <circle r="30" class="clock" />
        <line x1="0" y1="0" x2="0" y2="-24" class="hv-h" />
        <line x1="0" y1="0" x2={24 * Math.sin(-Math.PI / 6)} y2={-24 * Math.cos(-Math.PI / 6)} class="lv-h" />
        <text x="0" y="46" class="small">Dyn11</text>
      </g>
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
  .warn {
    color: var(--warn);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .core {
    fill: var(--faint);
    opacity: 0.35;
    transition: fill 0.15s;
  }
  .core.sat {
    fill: #c0392b;
    opacity: 0.6;
  }
  .win {
    fill: var(--panel);
  }
  .coil {
    fill: none;
    stroke-width: 3;
  }
  .hv {
    stroke: var(--c-a);
  }
  .lv {
    stroke: var(--c-C);
  }
  .src {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2.4;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .track {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .ibar {
    fill: var(--c-i);
  }
  .v {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .small {
    fill: var(--muted);
    font-size: 10.5px;
  }
  .clock {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .hv-h {
    stroke: var(--c-a);
    stroke-width: 3;
  }
  .lv-h {
    stroke: var(--c-C);
    stroke-width: 3;
  }
</style>
