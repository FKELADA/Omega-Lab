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
  import { ui } from './lib/ui/ui.svelte';

  /** Lessons are addressed by their course number in the URL hash, e.g. #1.4. */
  const fromHash = () => lessons.find((l) => l.id === location.hash.slice(1)) ?? lessons[0];

  let lab = $state(new Lab(fromHash().experiment!));
  let mapOpen = $state(false);

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
    const onHash = () => open(fromHash().experiment!);
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
  <TopBar exp={lab.exp} onmap={() => (mapOpen = true)} />

  {#key lab}
    <main>
      <div class="col left">
        <lab.exp.canvas {lab} />
        <LessonPanel {lab} />
      </div>
      <div class="col mid">
        <Scope {lab} />
        <div class="instruments" style="--n: {lab.exp.instruments.length}">
          {#each lab.exp.instruments as Instrument, k (k)}
            <Instrument {lab} />
          {/each}
        </div>
      </div>
      <div class="col right">
        <Equations {lab} />
      </div>
    </main>

    <ParamRail {lab} />
  {/key}

  {#if mapOpen}
    <CourseMap current={lab.exp.id} onpick={pick} onclose={() => (mapOpen = false)} />
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
  .mid > :global(.scope) {
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
    .mid > :global(.scope) {
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
