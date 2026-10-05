<script lang="ts">
  import { untrack } from 'svelte';
  import { lessons } from './lessons/curriculum';
  import { Lab } from './lib/lab/lab.svelte';
  import type { Experiment } from './lib/lab/types';
  import LessonPanel from './lib/lab/LessonPanel.svelte';
  import ParamRail from './lib/lab/ParamRail.svelte';
  import Scope from './lib/instruments/Scope.svelte';
  import Equations from './lib/instruments/Equations.svelte';
  import TopBar from './lib/ui/TopBar.svelte';
  import CourseMap from './lib/ui/CourseMap.svelte';
  import DocsPage from './lib/ui/DocsPage.svelte';
  import NoteView from './lib/ui/NoteView.svelte';
  import Zoomable from './lib/ui/Zoomable.svelte';
  import { ui } from './lib/ui/ui.svelte';
  /** The Atelier is loaded on demand: lessons do not pay for its solver and library. */
  const loadAtelier = () => import('./atelier/Atelier.svelte');

  /** Lessons are addressed by their course number in the URL hash, e.g. #1.4. */
  const fromHash = () => lessons.find((l) => l.id === location.hash.slice(1)) ?? lessons[0];

  let lab = $state(new Lab(fromHash().experiment!));
  let mapOpen = $state(false);
  const viewOf = (h: string): 'lab' | 'docs' | 'atelier' => (h === '#docs' ? 'docs' : h.startsWith('#atelier') ? 'atelier' : 'lab');
  let view = $state(viewOf(location.hash));
  /** The lesson to come back to from the Atelier or the docs. */
  let lastLesson = lessons.find((l) => l.id === location.hash.slice(1))?.id ?? lessons[0].id;
  const setMode = (m: 'lessons' | 'atelier') => (location.hash = m === 'atelier' ? 'atelier' : lastLesson);
  /** Open teaching note: a module, optionally scrolled to one of its lessons. */
  let note = $state<{ module: number; lesson?: string } | null>(null);
  const openNote = (module: number, lesson?: string) => {
    mapOpen = false;
    note = { module, lesson };
  };
  const currentLesson = () => lessons.find((l) => l.experiment === lab.exp);

  function open(e: Experiment) {
    if (e.id !== lab.exp.id) lab = new Lab(e);
    mapOpen = false;
  }
  function pick(e: Experiment) {
    const entry = lessons.find((l) => l.experiment === e);
    if (entry) location.hash = entry.id;
    open(e);
  }

  $effect(() => {
    const onHash = () => {
      view = viewOf(location.hash);
      if (view !== 'lab') return;
      lastLesson = fromHash().id;
      open(fromHash().experiment!);
    };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  });

  // Theme: explicit choice on <html>, and repaint canvas plots when colours change.
  $effect(() => {
    const root = document.documentElement;
    if (ui.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', ui.theme);
    root.lang = ui.lang;
    untrack(() => ui.paletteTick++);
  });
  $effect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const bump = () => ui.paletteTick++;
    mq.addEventListener('change', bump);
    return () => mq.removeEventListener('change', bump);
  });
</script>

<div class="app" data-hover={lab.hover ?? ''}>
  <TopBar
    exp={view === 'atelier' ? { ...lab.exp, path: [{ fr: 'Atelier', en: 'Workbench' }], title: { fr: 'Construire et simuler librement', en: 'Build and simulate freely' } } : lab.exp}
    onmap={() => (mapOpen = true)}
    ondocs={() => (location.hash = 'docs')}
    docs={view === 'docs'}
    mode={view === 'atelier' ? 'atelier' : 'lessons'}
    onmode={setMode}
  />

  {#if view === 'atelier'}
    {#await loadAtelier()}
      <p class="loading">…</p>
    {:then m}
      <m.default />
    {/await}
  {:else if view === 'docs'}
    <DocsPage onback={() => (location.hash = currentLesson()?.id ?? '')} />
  {:else}
  {#key lab}
    <main>
      <div class="col left">
        <Zoomable {lab} comp={lab.exp.canvas} />
        <LessonPanel {lab} onnote={() => {
          const id = currentLesson()?.id;
          if (id) openNote(+id.split('.')[0], id);
        }} />
      </div>
      <div class="col mid">
        <Zoomable {lab} comp={Scope} cls="scope-wrap" />
        <div class="instruments" style="--n: {lab.exp.instruments.length}; flex: {lab.exp.instruments.length >= 3 ? 1.4 : 1}">
          {#each lab.exp.instruments as Instrument, k (k)}
            <Zoomable {lab} comp={Instrument} />
          {/each}
        </div>
      </div>
      <div class="col right">
        <Equations {lab} />
      </div>
    </main>

    <ParamRail {lab} />
  {/key}
  {/if}

  {#if mapOpen}
    <CourseMap current={lab.exp.id} onpick={pick} onclose={() => (mapOpen = false)} onnote={openNote} />
  {/if}
  {#if note}
    <NoteView module={note.module} focus={note.lesson} onclose={() => (note = null)} />
  {/if}
</div>

<style>
  .app {
    height: 100vh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    grid-template-columns: minmax(0, 1fr);
  }
  main {
    display: grid;
    grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.6fr) minmax(330px, 1.05fr);
    gap: 12px;
    padding: 12px 16px;
    min-height: 0;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    min-width: 0;
  }
  .mid > :global(.scope-wrap) {
    flex: 1.5;
  }
  .instruments {
    display: grid;
    grid-template-columns: repeat(var(--n), minmax(0, 1fr));
    gap: 12px;
    flex: 1;
    min-height: 0;
  }
  .right > :global(.panel) {
    flex: 1;
  }
  .app > :global(.rail) {
    margin: 0 16px 12px;
  }

  @media (max-width: 1280px) {
    main {
      grid-template-columns: minmax(280px, 1fr) minmax(0, 1.7fr);
    }
    .right {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 1280px), (max-height: 760px) {
    .app {
      height: auto;
      min-height: 100vh;
    }
    .mid > :global(.scope-wrap) {
      min-height: 340px;
    }
  }
  @media (max-width: 860px) {
    main {
      grid-template-columns: minmax(0, 1fr);
    }
    .instruments {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
