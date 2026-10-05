<script lang="ts">
  // The instrument dock under the bench: one tab per analysis, each enlargeable.
  import type { Component } from 'svelte';
  import type { Lab } from '../../lib/lab/lab.svelte';
  import Scope from '../../lib/instruments/Scope.svelte';
  import Zoomable from '../../lib/ui/Zoomable.svelte';
  import BodePanel from './BodePanel.svelte';
  import ImpedancePanel from './ImpedancePanel.svelte';
  import PhasorPanel from './PhasorPanel.svelte';
  import PolesPanel from './PolesPanel.svelte';
  import ThdPanel from './ThdPanel.svelte';
  import PowerFlowPanel from './PowerFlowPanel.svelte';
  import { tr, type L } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  const TABS: { id: string; name: L; comp: Component<{ lab: Lab }> }[] = [
    { id: 'scope', name: { fr: 'Oscilloscope', en: 'Oscilloscope' }, comp: Scope },
    { id: 'bode', name: { fr: 'Bode', en: 'Bode' }, comp: BodePanel },
    { id: 'z', name: { fr: 'Impédance', en: 'Impedance' }, comp: ImpedancePanel },
    { id: 'ph', name: { fr: 'Phaseurs', en: 'Phasors' }, comp: PhasorPanel },
    { id: 'poles', name: { fr: 'Pôles', en: 'Poles' }, comp: PolesPanel },
    { id: 'thd', name: { fr: 'Harmoniques', en: 'Harmonics' }, comp: ThdPanel },
    { id: 'pf', name: { fr: 'Répartition', en: 'Power flow' }, comp: PowerFlowPanel },
  ];
  let tab = $state('scope');
  const current = $derived(TABS.find((t) => t.id === tab)!);
</script>

<div class="dock-tabs">
  <div class="tabs" role="tablist">
    {#each TABS as t (t.id)}
      <button role="tab" aria-selected={tab === t.id} class:on={tab === t.id} onclick={() => (tab = t.id)}>{tr(t.name)}</button>
    {/each}
  </div>
  {#key tab}
    <Zoomable {lab} comp={current.comp} cls="dock-panel" />
  {/key}
</div>

<style>
  .dock-tabs {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .tabs {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }
  .tabs button {
    border: 1px solid var(--line);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    background: var(--panel-2);
    color: var(--muted);
    padding: 3px 12px;
    font-size: 12.5px;
  }
  .tabs button.on {
    background: var(--panel);
    color: var(--ink);
    font-weight: 600;
  }
  .dock-tabs > :global(.dock-panel) {
    flex: 1;
    min-height: 0;
  }
</style>
