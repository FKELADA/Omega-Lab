<script lang="ts">
  // The same grid event seen by two inverters side by side: a grid-following
  // unit (a current source steered by a PLL) and a grid-forming unit (a voltage
  // source behind a reactance, with virtual inertia and droop).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { GRID_EVENTS, gridEvent, type GflGfmInfo } from '../../lib/models/module7';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as GflGfmInfo);
  const ev = $derived(gridEvent(lab.params.event, lab.t));
  const after = $derived(lab.t >= 0.1);
  const v = (id: string, d = 3) => (lab.concealed || !isFinite(lab.at(id)) ? '—' : num(lab.at(id), d));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Suiveur contre formeur de réseau', en: 'Grid-following versus grid-forming' })}</span>
    <span class="spacer"></span>
    {#if after}<span class="ev">{lab.params.event === GRID_EVENTS.phase ? tr({ fr: 'saut de phase −20°', en: 'phase jump −20°' }) : tr({ fr: 'chute de fréquence', en: 'frequency drop' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="GFL and GFM">
      {#each [0, 1] as j (j)}
        {@const y = 52 + j * 100}
        {@const gfm = j === 1}
        <!-- unit -->
        {#if gfm}
          <circle cx="44" cy={y} r="20" class="unit gfm" />
          <path d="M33,{y} c4,-10 7,-10 11,0 s7,10 11,0" class="sym gfm" />
          <path d="M64,{y} c3,-8 8,-8 11,0 c3,-8 8,-8 11,0" class="ind" />
          <text x="44" y={y - 28} class="name gfm">{tr({ fr: 'Formeur (GFM)', en: 'Grid-forming (GFM)' })}</text>
          <text x="44" y={y + 34} class="tiny">E∠δ · H = {num(lab.params.H, 2)} s</text>
        {:else}
          <circle cx="44" cy={y} r="20" class="unit gfl" />
          <path d="M44,{y + 10} v-20 m-6,6 l6,-6 l6,6" class="sym gfl" />
          <line x1="64" y1={y} x2="86" y2={y} class="w" />
          <text x="44" y={y - 28} class="name gfl">{tr({ fr: 'Suiveur (GFL)', en: 'Grid-following (GFL)' })}</text>
          <text x="44" y={y + 34} class="tiny">i* · PLL {num(lab.params.fpll, 3)} Hz</text>
        {/if}
        <line x1="86" y1={y} x2="150" y2={y} class="w" />
        <line x1="150" y1={y - 16} x2="150" y2={y + 16} class="bus" />
        <line x1="150" y1={y} x2="190" y2={y} class="w" />
        <path d="M190,{y} c3,-8 8,-8 11,0 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0" class="ind" />
        <text x="206" y={y - 14} class="tiny">1/SCR</text>
        <line x1="223" y1={y} x2="250" y2={y} class="w" />
        <circle cx="270" cy={y} r="18" class="grid" class:hit={after} />
        <path d="M260,{y} c3,-8 6,-8 10,0 s6,8 10,0" class="gs" />
        <!-- readouts -->
        {#if !lab.concealed}
          <text x="300" y={y - 6} class="ro" text-anchor="start">P = {v(gfm ? 'pGfm' : 'pGfl')} pu</text>
          <text x="300" y={y + 10} class="ro" text-anchor="start">f = {v(gfm ? 'fGfm' : 'fGfl', 4)} Hz</text>
        {/if}
        {#if !gfm && k.gflUnstable}<text x="120" y={y + 34} class="bad">{tr({ fr: 'instable', en: 'unstable' })}</text>{/if}
      {/each}
      <text x="270" y="200" class="tiny">{tr({ fr: 'réseau', en: 'grid' })} : {num(ev.f, 4)} Hz, {num((ev.th * 180) / Math.PI, 3)}°</text>
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
  .ev {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .unit {
    fill: var(--panel);
    stroke-width: 2.2;
  }
  .unit.gfl,
  .sym.gfl {
    stroke: var(--c-i);
  }
  .unit.gfm,
  .sym.gfm {
    stroke: var(--c-p);
  }
  .sym {
    fill: none;
    stroke-width: 2;
  }
  .name {
    font-size: 10.5px;
    font-weight: 700;
  }
  .name.gfl {
    fill: var(--c-i);
  }
  .name.gfm {
    fill: var(--c-p);
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .grid.hit {
    stroke: var(--warn);
  }
  .gs {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
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
  .bad {
    fill: var(--warn);
    font-size: 11px;
    font-weight: 700;
  }
</style>
