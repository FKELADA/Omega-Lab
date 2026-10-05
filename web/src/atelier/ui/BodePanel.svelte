<script lang="ts">
  // Bode plot of the bench: gain and phase from a chosen source to every signal
  // shown on the oscilloscope.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import XYChart from '../../lib/instruments/XYChart.svelte';
  import { sources } from '../analyses';
  import { useBench } from './context';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  const bench = useBench();
  const list = $derived(sources(bench.compiled.net));
</script>

<div class="bode">
  <div class="bar">
    <label for="bode-in">{tr({ fr: 'Entrée', en: 'Input' })}</label>
    <select id="bode-in" value={bench.bodeIn ?? list[0] ?? ''} onchange={(e) => (bench.bodeIn = e.currentTarget.value)}>
      {#each list as id (id)}<option value={id}>{id}</option>{/each}
    </select>
    <span class="hint">{tr({ fr: 'Sorties : les signaux affichés sur l’oscilloscope.', en: 'Outputs: the signals shown on the oscilloscope.' })}</span>
  </div>
  <div class="charts">
    <XYChart {lab} index={0} />
    <XYChart {lab} index={1} />
  </div>
</div>

<style>
  .bode {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    min-height: 0;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  .hint {
    color: var(--muted);
  }
  select {
    padding: 2px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel-2);
    color: var(--ink);
  }
  .charts {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    min-height: 0;
  }
  @media (max-width: 900px) {
    .charts {
      grid-template-columns: 1fr;
    }
  }
</style>
