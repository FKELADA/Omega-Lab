<script lang="ts">
  // Free-style mode: the bench in the middle, the library and the inspector on the
  // right, the instruments and the formulas underneath. The drawing compiles into
  // an Experiment, so the oscilloscope and the equation cards are the lessons' own.
  import { onDestroy } from 'svelte';
  import { Bench } from './bench.svelte';
  import Canvas from './ui/Canvas.svelte';
  import Inspector from './ui/Inspector.svelte';
  import LibraryPanel from './ui/LibraryPanel.svelte';
  import Scope from '../lib/instruments/Scope.svelte';
  import Equations from '../lib/instruments/Equations.svelte';
  import Zoomable from '../lib/ui/Zoomable.svelte';
  import { S, tr } from '../lib/ui/ui.svelte';

  const bench = new Bench();
  const lab = $derived(bench.lab);
  let canvas = $state<Canvas>();
  let tool = $state<'select' | 'pan'>('select');

  function add(type: string) {
    const [x, y] = canvas?.centre() ?? [10, 6];
    bench.add(type, x, y);
  }

  function onKey(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') (e.preventDefault(), e.shiftKey ? bench.redo() : bench.undo());
    else if (mod && e.key.toLowerCase() === 'y') (e.preventDefault(), bench.redo());
    else if (mod && e.key.toLowerCase() === 'a') (e.preventDefault(), bench.selectAll());
    else if (e.key === 'Delete' || e.key === 'Backspace') bench.removePicked();
    else if ((e.key === 'r' || e.key === 'R') && bench.selection?.kind === 'el') bench.rotate(bench.selection.id);
    else if (e.key === 'Escape') (bench.pending = null), (bench.selection = null);
    else if (e.key === 'v' || e.key === 'V') tool = 'select';
    else if (e.key === 'h' || e.key === 'H') tool = 'pan';
  }

  // Playback of the time cursor, as in the lessons.
  let raf = 0, last = 0;
  function frame(now: number) {
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    const f = lab.frac + dt / 6;
    lab.setFrac(f);
    if (f >= 1) return void (lab.playing = false);
    raf = requestAnimationFrame(frame);
  }
  function togglePlay() {
    if (lab.playing) return void ((lab.playing = false), cancelAnimationFrame(raf));
    if (lab.frac >= 0.999) lab.setFrac(0);
    lab.playing = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  onDestroy(() => cancelAnimationFrame(raf));
</script>

<svelte:window onkeydown={onKey} />

<div class="atelier" data-hover={lab.hover ?? ''}>
  <div class="center">
    <div class="toolbar">
      <button class="btn" disabled={!bench.canUndo} onclick={() => bench.undo()} title="Ctrl+Z">↶</button>
      <button class="btn" disabled={!bench.canRedo} onclick={() => bench.redo()} title="Ctrl+Y">↷</button>
      <div class="seg" role="group" aria-label={tr({ fr: 'Outil', en: 'Tool' })}>
        <button class:on={tool === 'select'} onclick={() => (tool = 'select')} title={tr({ fr: 'Sélectionner (V) : glisser pour encadrer, Maj+clic pour ajouter', en: 'Select (V): drag a box, Shift+click to add' })}>⬚ {tr({ fr: 'Sélection', en: 'Select' })}</button>
        <button class:on={tool === 'pan'} onclick={() => (tool = 'pan')} title={tr({ fr: 'Déplacer la vue (H, ou bouton du milieu, ou Espace)', en: 'Pan the view (H, or middle button, or Space)' })}>✥ {tr({ fr: 'Vue', en: 'Pan' })}</button>
      </div>
      <button class="btn" onclick={() => bench.selectAll()} title="Ctrl+A">{tr({ fr: 'Tout sélectionner', en: 'Select all' })}</button>
      <button class="btn" disabled={!bench.picked.els.length && !bench.picked.wires.length} onclick={() => bench.removePicked()} title={tr({ fr: 'Suppr', en: 'Del' })}>✕ {tr({ fr: 'Effacer la sélection', en: 'Delete selection' })}</button>
      <button class="btn danger" disabled={!bench.doc.elements.length && !bench.doc.wires.length} onclick={() => bench.clearAll()}>🗑 {tr({ fr: 'Tout effacer', en: 'Clear all' })}</button>
      <button class="btn" onclick={() => canvas?.fit()}>⤧ {tr({ fr: 'Tout voir', en: 'Fit' })}</button>
      <span class="sep"></span>
      <button class="btn play" onclick={togglePlay} aria-label={lab.playing ? tr(S.pause) : tr(S.play)}>{lab.playing ? '❚❚' : '▶'}</button>
      <input id="tcursor" type="range" min="0" max="1000" value={lab.frac * 1000} oninput={(e) => lab.setFrac(+e.currentTarget.value / 1000)} aria-label={tr(S.time)} />
      <span class="mono">{lab.fmtT(lab.t)} / {lab.fmtT(lab.tEnd)}</span>
      <button class="btn" onclick={() => lab.freeze()}>❄ {tr(S.freeze)}</button>
      <button class="btn" disabled={!lab.ghosts.length} onclick={() => lab.clearGhosts()}>{tr(S.clear)}</button>
    </div>
    <Canvas {bench} {tool} bind:this={canvas} />
    {#key lab}
      <div class="dock">
        <Zoomable {lab} comp={Scope} cls="scope-wrap" />
        <Equations {lab} />
      </div>
    {/key}
  </div>
  <div class="side">
    <LibraryPanel onadd={add} />
    <Inspector {bench} onfit={() => canvas?.fit()} />
  </div>
</div>

<style>
  .atelier {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 330px;
    gap: 12px;
    padding: 12px 16px;
    min-height: 0;
  }
  .center {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    min-width: 0;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .toolbar input[type='range'] {
    flex: 1;
    min-width: 120px;
  }
  .danger {
    color: var(--warn);
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    border: none;
    background: var(--panel);
    color: var(--muted);
    padding: 4px 10px;
    font-size: 12.5px;
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .sep {
    width: 8px;
  }
  .mono {
    font: 12px var(--mono, monospace);
    color: var(--muted);
    white-space: nowrap;
  }
  .center > :global(.canvas) {
    flex: 1.3;
    min-height: 260px;
  }
  .dock {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 12px;
    min-height: 240px;
  }
  .dock > :global(*) {
    min-height: 0;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }
  .side > :global(.lib) {
    flex: 1;
    min-height: 0;
  }
  .side > :global(.insp) {
    flex: 1.2;
    min-height: 0;
  }
  @media (max-width: 1100px) {
    .atelier {
      grid-template-columns: minmax(0, 1fr);
    }
    .dock {
      grid-template-columns: minmax(0, 1fr);
    }
    .center > :global(.canvas) {
      min-height: 420px;
    }
    .dock > :global(*) {
      min-height: 300px;
    }
  }
</style>
