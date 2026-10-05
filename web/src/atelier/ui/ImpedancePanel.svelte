<script lang="ts">
  // Impedance scan: |Z(f)| seen from an impedance probe (or a source's terminals),
  // with the series and parallel resonances marked.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import XYChart from '../../lib/instruments/XYChart.svelte';
  import { sources } from '../analyses';
  import { useBench } from './context';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  const bench = useBench();
  const places = $derived([...bench.compiled.net.active.filter(({ def }) => def.type === 'zprobe').map(({ el }) => el.id), ...sources(bench.compiled.net)]);
</script>

<div class="z">
  <div class="bar">
    <label for="z-at">{tr({ fr: 'Vue depuis', en: 'Seen from' })}</label>
    <select id="z-at" value={bench.zAt ?? places[0] ?? ''} onchange={(e) => (bench.zAt = e.currentTarget.value)}>
      {#each places as id (id)}<option value={id}>{id}</option>{/each}
    </select>
    <span class="hint">{tr({ fr: 'Posez une sonde d’impédance (Instruments) sur le nœud à étudier.', en: 'Place an impedance probe (Instruments) on the node to study.' })}</span>
  </div>
  <XYChart {lab} index={2} />
</div>

<style>
  .z {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    min-height: 0;
  }
  .z > :global(.panel) {
    flex: 1;
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
</style>
