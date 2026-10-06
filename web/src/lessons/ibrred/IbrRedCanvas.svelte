<script lang="ts">
  // The converter as a chain of blocks, from its DC side to the grid. The blocks a level makes
  // algebraic (assumed instantaneous) are greyed out; the synchronising block always stays.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { IbrInfo } from '../../lib/models/g2data-b';
  import { S, tr, type L } from '../../lib/ui/ui.svelte';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as IbrInfo);
  type Block = { id: string; name: L };
  const BLOCKS: Record<'gfm' | 'gfl', Block[]> = {
    gfm: [
      { id: 'dc', name: { fr: 'bus continu', en: 'DC link' } },
      { id: 'sync', name: { fr: 'statisme P–f', en: 'P–f droop' } },
      { id: 'outer', name: { fr: 'boucle de tension', en: 'voltage loop' } },
      { id: 'inner', name: { fr: 'boucle de courant', en: 'current loop' } },
      { id: 'filter', name: { fr: 'filtre LC', en: 'LC filter' } },
      { id: 'trafo', name: { fr: 'transfo', en: 'transformer' } },
    ],
    gfl: [
      { id: 'dc', name: { fr: 'bus continu', en: 'DC link' } },
      { id: 'sync', name: { fr: 'PLL', en: 'PLL' } },
      { id: 'outer', name: { fr: 'boucles externes', en: 'outer loops' } },
      { id: 'inner', name: { fr: 'boucle de courant', en: 'current loop' } },
      { id: 'filter', name: { fr: 'filtre LCL', en: 'LCL filter' } },
      { id: 'trafo', name: { fr: 'transfo', en: 'transformer' } },
    ],
  };
  /** Blocks made algebraic at each level (cumulative). */
  const GONE: Record<string, string[]> = {
    full: [],
    no_trafo: ['trafo'],
    no_filter: ['trafo', 'filter'],
    no_inner: ['trafo', 'filter', 'inner'],
    no_voltage: ['trafo', 'filter', 'inner', 'outer'],
    droop: ['trafo', 'filter', 'inner', 'outer', 'dc'],
    no_dc: ['trafo', 'filter', 'inner', 'dc'],
    pll: ['trafo', 'filter', 'inner', 'dc', 'outer'],
  };
  const gone = $derived(GONE[k.level.id] ?? []);
  const blocks = $derived(BLOCKS[k.conv]);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.failed}<span class="kit-warn">{tr({ fr: 'simulation non convergée', en: 'simulation did not converge' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 200" role="img" aria-label="Converter blocks">
      {#each blocks as b, i (b.id)}
        {@const x = 10 + i * 64}
        <g class:dim={gone.includes(b.id)}>
          <rect {x} y="60" width="56" height="44" rx="6" class="box" style={b.id === 'sync' ? 'stroke: var(--accent)' : ''} />
          <text x={x + 28} y="78" class="small">{tr(b.name).split(' ')[0]}</text>
          <text x={x + 28} y="92" class="small">{tr(b.name).split(' ').slice(1).join(' ')}</text>
        </g>
        {#if i < blocks.length - 1}<line x1={x + 56} y1="82" x2={x + 64} y2="82" class="w" />{/if}
      {/each}
      <line x1="394" y1="70" x2="394" y2="94" class="bus" />
      <text x="200" y="40" class="v">{tr(k.level.name)}</text>
      <text x="200" y="140" class="v">{k.level.n} {tr({ fr: 'états', en: 'states' })} · {tr({ fr: 'modèle complet', en: 'full model' })} : {k.full.n}</text>
      <text x="200" y="164" class="small">{tr({ fr: 'grisé : supposé instantané (algébrique)', en: 'greyed: assumed instantaneous (algebraic)' })}</text>
      <text x="200" y="186" class="small">{tr({ fr: 'événement : saut de phase de', en: 'event: phase jump of' })} {k.conv === 'gfm' ? 10 : 3}° {tr({ fr: 'au réseau', en: 'at the grid' })}</text>
    </svg>
  </div>
</section>
