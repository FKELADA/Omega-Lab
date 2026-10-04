<script lang="ts">
  // From the power plants to the houses: generation, step-up transformer, the
  // transmission line at the chosen voltage, substations, the 230 V network.
  // The dots carry energy; they move as time runs and speed up with demand.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { DayInfo } from '../../lib/models/module0';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as DayInfo);
  const offset = $derived(-lab.t * 60);
  const lossy = $derived(k.line.share > 0.1);
  const g = $derived({
    base: lab.at('base'),
    wind: lab.at('wind'),
    pv: lab.at('pv'),
    flex: lab.at('flex'),
    demand: lab.at('demand'),
  });
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'De la centrale à la prise', en: 'From power plant to socket' })}</span>
    <span class="spacer"></span>
    <span class="clock">{num(lab.t, 3)} h</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 240" role="img" aria-label="Power system chain">
      <!-- plants -->
      <g data-term="L" style="color: var(--c-L)">
        <path d="M14,92 q6,-30 2,-46 h18 q-4,16 2,46 z" class="plant" />
        <text x="25" y="106" class="lbl">{tr({ fr: 'nucléaire', en: 'nuclear' })}</text>
        <text x="25" y="118" class="v">{num(g.base, 3)} GW</text>
      </g>
      <g data-term="C" style="color: var(--c-C)">
        <line x1="70" y1="92" x2="70" y2="58" class="plant-l" />
        <path d="M70,58 l-14,-6 M70,58 l10,-12 M70,58 l4,15" class="plant-l" transform="rotate({lab.t * 360} 70 58)" />
        <text x="70" y="106" class="lbl">{tr({ fr: 'éolien', en: 'wind' })}</text>
        <text x="70" y="118" class="v">{num(g.wind, 3)} GW</text>
      </g>
      <g data-term="i" style="color: var(--c-i)">
        <rect x="100" y="66" width="28" height="18" class="plant" transform="skewX(-15)" />
        <circle cx="122" cy="48" r="6" class="sun" opacity={g.pv > 0.1 ? 1 : 0.2} />
        <text x="112" y="106" class="lbl">PV</text>
        <text x="112" y="118" class="v">{num(g.pv, 3)} GW</text>
      </g>
      <g data-term="p" style="color: var(--c-p)">
        <rect x="140" y="62" width="26" height="30" class="plant" />
        <text x="153" y="82" class="fl">~</text>
        <text x="153" y="106" class="lbl">{tr({ fr: 'flexible', en: 'flexible' })}</text>
        <text x="153" y="118" class="v" class:bad={g.flex < 0}>{num(g.flex, 3)} GW</text>
      </g>

      <!-- step-up, line, step-down -->
      <line x1="10" y1="140" x2="390" y2="140" class="bus" />
      <circle cx="186" cy="140" r="9" class="tf" /><circle cx="196" cy="140" r="9" class="tf" />
      <path d="M205,140 H330" class="line" class:lossy />
      <path d="M205,140 H330" class="flow" style="stroke-dashoffset: {offset}" />
      {#each [228, 268, 308] as x (x)}
        <path d="M{x - 8},176 L{x},128 L{x + 8},176 M{x - 6},134 H{x + 6}" class="pylon" />
      {/each}
      <text x="268" y="122" class="kv">{lab.params.kV} kV</text>
      <circle cx="338" cy="140" r="9" class="tf" /><circle cx="348" cy="140" r="9" class="tf" />

      <!-- houses -->
      {#each [0, 1, 2] as j (j)}
        <path d="M{356 + j * 12},176 v-12 l5,-6 l5,6 v12 z" class="house" />
      {/each}
      <text x="372" y="192" class="lbl">230 V</text>
      <text x="200" y="210" class="v" data-term="S">{tr({ fr: 'consommation', en: 'demand' })} {num(g.demand, 3)} GW</text>
      <text x="268" y="230" class="small" class:bad={lossy}>
        1 GW {tr({ fr: 'sur', en: 'over' })} 300 km : I = {si(k.line.I, 'A')}, {tr({ fr: 'pertes', en: 'losses' })} {num(100 * k.line.share, 3)} %
      </text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 250px;
    display: block;
  }
  text {
    text-anchor: middle;
  }
  .clock {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
    font-weight: 600;
  }
  .plant {
    fill: var(--panel-2);
    stroke: currentColor;
    stroke-width: 2;
  }
  .plant-l {
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .sun {
    fill: currentColor;
  }
  .fl {
    fill: currentColor;
    font-size: 16px;
    font-weight: 700;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .v.bad,
  .small.bad {
    fill: var(--warn);
    font-weight: 700;
  }
  .bus {
    stroke: var(--line);
    stroke-width: 1;
  }
  .tf {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .line {
    stroke: var(--muted);
    stroke-width: 3;
  }
  .line.lossy {
    stroke: var(--warn);
  }
  .flow {
    stroke: var(--c-i);
    stroke-width: 5;
    stroke-dasharray: 0.1 14;
    stroke-linecap: round;
    fill: none;
  }
  .pylon {
    fill: none;
    stroke: var(--faint);
    stroke-width: 1.4;
  }
  .kv {
    fill: var(--accent);
    font-size: 12px;
    font-weight: 700;
  }
  .house {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.4;
  }
  .small {
    fill: var(--muted);
    font-size: 10.5px;
  }
</style>
