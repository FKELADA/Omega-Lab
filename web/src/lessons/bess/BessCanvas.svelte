<script lang="ts">
  // The system at the cursor: synchronous generation (inertia, governors), the
  // load, the unit that trips at t = 1 s, and the battery with its state of
  // charge and output. A frequency meter shows the deviation.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { BESS, BESS_MODES, type BessInfo } from '../../lib/models/module7c';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as BessInfo);
  const tripped = $derived(lab.t >= BESS.tLoss);
  const f = $derived(lab.at('f'));
  const soc = $derived(lab.at('soc'));
  const pb = $derived(lab.at('pb'));
  const needle = $derived(Math.max(-1, Math.min(1, (f - 50) / 1)) * 70);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Réseau de 30 GW', en: '30 GW system' })}</span>
    <span class="spacer"></span>
    {#if tripped}<span class="warn">{tr({ fr: 'perte de 1 GW', en: '1 GW lost' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="System with battery">
      <!-- generation -->
      {#each [0, 1, 2] as j (j)}
        <circle cx={36 + j * 44} cy="46" r="16" class="gen" class:lost={j === 2 && tripped} />
        <path d="M{27 + j * 44},46 c3,-7 6,-7 9,0 s6,7 9,0" class="sym" class:lost={j === 2 && tripped} />
        <line x1={36 + j * 44} y1="62" x2={36 + j * 44} y2="96" class="w" class:lost={j === 2 && tripped} />
      {/each}
      {#if tripped}<path d="M110,30 l20,20 m0,-20 l-20,20" class="x" />{/if}
      <text x="80" y="22" class="lbl">H = {num(lab.params.H, 3)} s</text>
      <line x1="20" y1="96" x2="300" y2="96" class="bus" />
      <!-- load -->
      <line x1="200" y1="96" x2="200" y2="130" class="w" />
      <path d="M192,122 l8,12 l8,-12" class="load" />
      <text x="200" y="150" class="lbl">{tr({ fr: 'charge', en: 'load' })} 30 GW</text>
      <!-- battery -->
      <line x1="270" y1="96" x2="270" y2="120" class="w" />
      <rect x="248" y="120" width="44" height="70" rx="4" class="batt" />
      <rect x="250" y={122 + 66 * (1 - Math.max(0, Math.min(100, isFinite(soc) ? soc : 50)) / 100)} width="40" height={66 * (Math.max(0, Math.min(100, isFinite(soc) ? soc : 50)) / 100)} class="soc" class:low={k.empty} />
      <rect x="262" y="114" width="16" height="6" rx="1" class="cap" />
      <text x="270" y="204" class="lbl">{num(lab.params.Pb, 3)} MW · {num(lab.params.Eb, 3)} MWh</text>
      {#if !lab.concealed && isFinite(pb)}
        <text x="318" y="140" class="ro" text-anchor="start">P = {num(pb, 3)} MW</text>
        <text x="318" y="156" class="ro" text-anchor="start">SoC = {num(soc, 3)} %</text>
        <text x="318" y="172" class="tiny" text-anchor="start">{lab.params.mode === BESS_MODES.droop ? tr({ fr: 'statisme', en: 'droop' }) : tr({ fr: 'FFR déclenchée < 49,8 Hz', en: 'FFR triggered < 49.8 Hz' })}</text>
      {/if}
      <!-- frequency meter -->
      <path d="M314,60 A50,50 0 0 1 394,60" class="dial" />
      <line x1="354" y1="78" x2={354 + 46 * Math.sin((needle * Math.PI) / 180)} y2={78 - 46 * Math.cos((needle * Math.PI) / 180)} class="needle" />
      <text x="320" y="72" class="tiny">49</text>
      <text x="388" y="72" class="tiny">51</text>
      {#if !lab.concealed}<text x="354" y="96" class="freq">{num(f, 4)} Hz</text>{/if}
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
  .gen {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .gen.lost,
  .sym.lost,
  .w.lost {
    stroke: var(--line);
  }
  .x {
    stroke: var(--warn);
    stroke-width: 3;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .load {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .batt {
    fill: var(--panel);
    stroke: var(--c-i);
    stroke-width: 2;
  }
  .soc {
    fill: var(--c-i);
    opacity: 0.7;
  }
  .soc.low {
    fill: var(--warn);
  }
  .cap {
    fill: var(--c-i);
  }
  .dial {
    fill: none;
    stroke: var(--line);
    stroke-width: 6;
  }
  .needle {
    stroke: var(--warn);
    stroke-width: 2.5;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .tiny {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .ro {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .freq {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
</style>
