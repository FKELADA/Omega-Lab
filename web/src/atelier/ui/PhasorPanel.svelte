<script lang="ts">
  // Steady-state phasors at the fundamental, or why there are none.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import PhasorDiagram from '../../lib/instruments/PhasorDiagram.svelte';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
</script>

{#if lab.info.ss}
  <PhasorDiagram {lab} />
{:else}
  <section class="panel">
    <header><span>{tr({ fr: 'Phaseurs', en: 'Phasors' })}</span></header>
    <div class="body">
      <p class="msg">
        {tr({
          fr: 'Les phaseurs décrivent le régime sinusoïdal établi : ajoutez une source alternative (ou carrée), dont la fréquence sera la fréquence fondamentale.',
          en: 'Phasors describe the sinusoidal steady state: add an AC (or square-wave) source, whose frequency becomes the fundamental.',
        })}
      </p>
    </div>
  </section>
{/if}

<style>
  .msg {
    color: var(--muted);
    font-size: 13px;
  }
</style>
