<script lang="ts">
  // A 60-cell module in three substrings with bypass diodes, under the sun (and
  // a cloud after 2 s). A shaded substring is drawn darker; when its bypass diode
  // conducts, the substring is skipped. Live V, I, P at the cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { pvIrradiance, PVM, substringVoltages, type PvInfo } from '../../lib/models/module7b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PvInfo);
  const G = $derived(pvIrradiance(lab.params, lab.t));
  const I = $derived(lab.at('I'));
  const Vs = $derived(substringVoltages(G, lab.params.T, lab.params.shade, isFinite(I) ? I : 0));
  const cloudy = $derived(lab.t >= PVM.tCloud && lab.params.cloud > 0.01);
  const cellFill = (j: number) => {
    const g = j === 0 ? G * (1 - lab.params.shade) : G;
    const l = 25 + 35 * (g / 1000);
    return `hsl(215 60% ${l}%)`;
  };
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Module photovoltaïque', en: 'PV module' })}</span>
    <span class="spacer"></span>
    {#if k.stuckLocal}<span class="warn">{tr({ fr: 'bloqué sur un maximum local', en: 'stuck on a local maximum' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="PV module">
      <!-- sun and cloud -->
      <circle cx="350" cy="36" r="16" class="sun" style="opacity: {0.3 + (0.7 * G) / 1000}" />
      {#if cloudy}<path d="M318,52 a12,12 0 0 1 22,-6 a14,14 0 0 1 26,4 a10,10 0 0 1 -2,20 h-42 a10,10 0 0 1 -4,-18 z" class="cloud" />{/if}
      <text x="350" y="86" class="lbl">{num(G, 3)} W/m² · {num(lab.params.T, 3)} °C</text>
      <!-- three substrings of 20 cells -->
      {#each [0, 1, 2] as j (j)}
        {@const y0 = 22 + j * 52}
        {@const bypassed = Vs[j] <= -0.49}
        {#each Array.from({ length: 20 }, (_, c) => c) as c (c)}
          <rect x={20 + (c % 10) * 22} y={y0 + Math.floor(c / 10) * 22} width="20" height="20" rx="2" fill={cellFill(j)} class="cell" class:skip={bypassed} />
        {/each}
        <!-- bypass diode -->
        <line x1="246" y1={y0 + 4} x2="246" y2={y0 + 40} class="w" class:on={bypassed} />
        <path d="M238,{y0 + 26} h16 l-8,-10 z M238,{y0 + 15} h16" class="diode" class:on={bypassed} />
        <text x="262" y={y0 + 25} class="sv" class:skip={bypassed} text-anchor="start">{num(Vs[j], 3)} V</text>
      {/each}
      {#if lab.params.shade > 0.01}<text x="128" y="16" class="lbl">{tr({ fr: 'ombre', en: 'shade' })} {num(lab.params.shade * 100, 3)} %</text>{/if}
      {#if !lab.concealed}
        <text x="316" y="140" class="ro" text-anchor="start">V = {num(lab.at('V'), 3)} V</text>
        <text x="316" y="158" class="ro" text-anchor="start">I = {num(I, 3)} A</text>
        <text x="316" y="176" class="ro big" text-anchor="start">P = {num(lab.at('P'), 3)} W</text>
        <text x="316" y="196" class="lbl" text-anchor="start">P<tspan baseline-shift="sub" font-size="7">max</tspan> = {num(lab.at('Pa'), 3)} W</text>
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
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .sun {
    fill: #f2b31b;
  }
  .cloud {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .cell {
    stroke: var(--panel);
    stroke-width: 1;
  }
  .cell.skip {
    opacity: 0.45;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .w.on {
    stroke: var(--warn);
    stroke-width: 2.5;
  }
  .diode {
    fill: var(--panel);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .diode.on {
    fill: var(--warn);
    stroke: var(--warn);
  }
  .sv {
    fill: var(--ink);
    font-size: 10px;
    font-family: var(--mono);
  }
  .sv.skip {
    fill: var(--warn);
    font-weight: 700;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .ro {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .ro.big {
    fill: var(--c-p);
    font-weight: 700;
    font-size: 12px;
  }
</style>
