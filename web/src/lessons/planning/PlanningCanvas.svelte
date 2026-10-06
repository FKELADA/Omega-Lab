<script lang="ts">
  // The primary substation with its two transformers (one lost in the N-1 case), the MV
  // back-up towards neighbours, the flexible customers, and the year at the cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { PLAN, type PlanInfo } from '../../lib/models/module10';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PlanInfo);
  const over = $derived(lab.at('net') > lab.at('firm'));
  const reinforced = $derived(lab.at('firm') > k.firm + 1);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if over}<span class="kit-warn">{tr({ fr: 'N-1 non tenu', en: 'N-1 not met' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 210" role="img" aria-label="Primary substation planning">
      <line x1="40" y1="20" x2="200" y2="20" class="bus" />
      <text x="120" y="12" class="small">63 kV</text>
      {#each [0, 1, 2] as t (t)}
        {#if t < 2 || reinforced}
          <g transform="translate({70 + t * 55},0)" class:dim={t === 1}>
            <line x1="0" y1="20" x2="0" y2="40" class="w" />
            <circle cx="0" cy="50" r="10" class="coil" />
            <circle cx="0" cy="64" r="10" class="coil2" />
            <line x1="0" y1="74" x2="0" y2="94" class="w" />
            {#if t === 1}<text x="0" y="58" class="big bad">✗</text>{/if}
            {#if t === 2}<text x="0" y="110" class="small ok">{tr({ fr: 'renfort', en: 'new' })}</text>{/if}
          </g>
        {/if}
      {/each}
      <line x1="40" y1="94" x2="200" y2="94" class="bus" />
      <text x="120" y="130" class="small">{PLAN.trafo} MVA × {reinforced ? 3 : 2} · 20 kV</text>
      <!-- MV back-up to a neighbour -->
      <line x1="200" y1="94" x2="300" y2="94" class="w" stroke-dasharray={lab.params.backup > 0 ? undefined : '4 4'} />
      <rect x="300" y="80" width="70" height="28" rx="4" class="box" />
      <text x="335" y="98" class="small">{tr({ fr: 'poste voisin', en: 'neighbour' })}</text>
      <text x="250" y="86" class="small">{num(lab.params.backup, 2)} MW</text>
      <!-- flexible customers -->
      {#each [60, 100, 140, 180] as x (x)}
        <line x1={x} y1="94" x2={x} y2="150" class="thin" />
        <path d="M{x},150 v10 m-5,-5 l5,7 l5,-7" class="load" />
      {/each}
      <text x="120" y="182" class="small">{tr({ fr: 'flexibilité', en: 'flexibility' })} {num(lab.params.flex, 2)} MW · {num(lab.params.price, 3)} k€/MW/{tr({ fr: 'an', en: 'yr' })}</text>
      <text x="300" y="150" class="v">{tr({ fr: 'année', en: 'year' })} {num(lab.t, 2)}</text>
      <text x="300" y="170" class="small">{num(lab.at('peak'), 3)} / {num(lab.at('firm'), 3)} MW</text>
      <text x="300" y="196" class="small">{tr({ fr: 'report', en: 'deferral' })} {num(k.deferral, 2)} {tr({ fr: 'ans', en: 'yr' })}</text>
    </svg>
  </div>
</section>
