<script lang="ts">
  // The chain of voltage levels from the 400 kV grid to the meter, with the TSO/DSO boundary;
  // the chosen level is highlighted with its current, losses and loading.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { LEVELS, type LevelInfo } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LevelInfo);
  const here = $derived(Math.round(lab.params.level));
  const y = (i: number) => 26 + i * 30;
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.loading > 100}<span class="kit-warn">{tr({ fr: 'surcharge thermique', en: 'thermal overload' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 220" role="img" aria-label="Voltage levels">
      <!-- TSO / DSO bands -->
      <rect x="6" y="10" width="20" height={y(3) + 14 - 10} rx="4" class="box" />
      <text x="16" y="70" class="small" transform="rotate(-90 16 70)">GRT</text>
      <rect x="6" y={y(4) - 14} width="20" height="58" rx="4" class="box" />
      <text x="16" y={y(4) + 16} class="small" transform="rotate(-90 16 {y(4) + 16})">GRD</text>
      {#each LEVELS as l, i (l.name)}
        <g class:dim={i !== here}>
          <line x1="36" y1={y(i)} x2={36 + 120 * Math.sqrt(l.U / 400) + 8} y2={y(i)} class={i === here ? 'flow' : 'w'} />
          <text x="172" y={y(i) + 4} class="small" style="text-anchor: start; font-weight: {i === here ? 700 : 400}">{l.name} · {tr(l.role)}</text>
        </g>
        {#if i < LEVELS.length - 1}
          <circle cx="44" cy={y(i) + 15} r="4" class="coil" />
          <circle cx="44" cy={y(i) + 19} r="4" class="coil2" />
        {/if}
      {/each}
      <text x="200" y="214" class="v">
        I = {num(k.I * 1000, 3)} A · p<tspan baseline-shift="sub" font-size="8">J</tspan> = {num(k.losses, 3)} % · ΔV = {num(k.dv, 3)} % · {num(k.loading, 3)} %
      </text>
    </svg>
  </div>
</section>
