<script lang="ts">
  // Wraps a lesson panel with an "enlarge" button that opens the same panel,
  // live, in a large overlay. Escape or a click outside closes it.
  import type { Lab } from '../lab/lab.svelte';
  import type { LabComponent } from '../lab/types';
  import { tr } from './ui.svelte';
  import ZoomContext from './ZoomContext.svelte';

  let { lab, comp: Comp, cls = '', style = '' }: { lab: Lab; comp: LabComponent; cls?: string; style?: string } = $props();
  let big = $state(false);

  $effect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (big = false);
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });
</script>

<div class="zoomable {cls}" {style}>
  <Comp {lab} />
  <button class="grow" title={tr({ fr: 'Agrandir', en: 'Enlarge' })} aria-label={tr({ fr: 'Agrandir', en: 'Enlarge' })} onclick={() => (big = true)}>⤢</button>
</div>

{#if big}
  <div class="backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && (big = false)}>
    <div class="zoom-modal" role="dialog" aria-modal="true">
      <button class="close" aria-label={tr({ fr: 'Fermer', en: 'Close' })} onclick={() => (big = false)}>✕</button>
      <ZoomContext><Comp {lab} /></ZoomContext>
      <p class="hint">{tr({ fr: 'Graphiques : molette pour zoomer, glisser pour déplacer, double-clic pour revenir. Échap pour fermer.', en: 'Charts: wheel to zoom, drag to pan, double-click to reset. Escape to close.' })}</p>
    </div>
  </div>
{/if}

<style>
  .zoomable {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .zoomable > :global(.panel) {
    flex: 1;
    min-height: 0;
  }
  .zoomable > :global(.panel > header) {
    padding-right: 36px;
  }
  .grow {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 5;
    width: 24px;
    height: 24px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel);
    color: var(--muted);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    opacity: 0.75;
  }
  .grow:hover {
    opacity: 1;
    color: var(--accent);
    border-color: var(--accent);
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(10, 12, 18, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2vh 2vw;
  }
  .zoom-modal {
    position: relative;
    width: min(1500px, 96vw);
    height: 94vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  }
  .zoom-modal > :global(.panel) {
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .zoom-modal :global(svg) {
    max-height: calc(94vh - 140px) !important;
  }
  .zoom-modal :global(.panel > header) {
    padding-right: 44px;
  }
  .close {
    position: absolute;
    top: 18px;
    right: 22px;
    z-index: 6;
    width: 28px;
    height: 28px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel);
    cursor: pointer;
  }
  .hint {
    margin: 6px 4px 0;
    font-size: 11.5px;
    color: var(--muted);
  }
</style>
