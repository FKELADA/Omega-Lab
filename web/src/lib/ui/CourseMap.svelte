<script lang="ts">
  import { curriculum } from '../../lessons/curriculum';
  import type { Experiment } from '../lab/types';
  import { S, tr } from './ui.svelte';

  let {
    current,
    onpick,
    onclose,
    onnote,
  }: { current: string; onpick: (e: Experiment) => void; onclose: () => void; onnote: (module: number, lesson?: string) => void } =
    $props();
  const NOTE = { fr: 'Note pédagogique', en: 'Teaching note' };

  // Open on the current lesson rather than at the top of a long list.
  let drawer = $state<HTMLElement>();
  $effect(() => {
    drawer?.querySelector('.lesson.cur')?.scrollIntoView({ block: 'center' });
  });
</script>

<div class="scrim" role="presentation" onclick={onclose}></div>
<aside class="drawer" aria-label={tr(S.modules)} bind:this={drawer}>
  <header>
    <h2>{tr(S.modules)}</h2>
    <button class="btn" onclick={onclose} aria-label="Close">✕</button>
  </header>
  <ol class="modules">
    {#each curriculum as m (m.n)}
      <li>
        <div class="mod">
          <span class="n">{m.n}</span>{tr(m.title)}
          <button class="info" title={tr(NOTE)} aria-label="{tr(NOTE)} — module {m.n}" onclick={() => onnote(m.n)}>ⓘ</button>
        </div>
        <ul>
          {#each m.lessons as l (l.id)}
            <li>
              {#if l.experiment}
                <div class="row">
                  <button class="lesson" class:cur={l.experiment.id === current} onclick={() => onpick(l.experiment!)}>
                    <span class="id">{l.id}</span>{tr(l.title)}
                  </button>
                  <button class="info" title={tr(NOTE)} aria-label="{tr(NOTE)} — {l.id}" onclick={() => onnote(m.n, l.id)}>ⓘ</button>
                </div>
              {:else}
                <span class="lesson off"><span class="id">{l.id}</span>{tr(l.title)}<em>{tr(S.soon)}</em></span>
              {/if}
            </li>
          {/each}
        </ul>
      </li>
    {/each}
  </ol>
</aside>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(10, 12, 18, 0.35);
    z-index: 40;
  }
  .drawer {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(380px, 92vw);
    background: var(--panel);
    border-right: 1px solid var(--line);
    z-index: 41;
    overflow-y: auto;
    padding: 12px 16px 24px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    margin: 4px 0;
    font-size: 16px;
  }
  .modules {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
  }
  .mod {
    font-weight: 600;
    margin: 12px 0 4px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 12px;
  }
  ul {
    list-style: none;
    padding: 0 0 0 30px;
    margin: 0;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .info {
    border: none;
    background: none;
    color: var(--accent);
    font-size: 15px;
    padding: 0 6px;
    margin-left: auto;
    border-radius: 6px;
  }
  .info:hover {
    background: var(--accent-soft);
  }
  .lesson {
    display: flex;
    gap: 8px;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    padding: 3px 6px;
    border-radius: 6px;
    font-size: 13px;
  }
  button.lesson:hover {
    background: var(--hot);
  }
  .lesson.cur {
    background: var(--accent-soft);
    font-weight: 600;
  }
  .lesson.off {
    color: var(--faint);
  }
  .id {
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--faint);
    min-width: 26px;
    padding-top: 1px;
  }
  em {
    margin-left: auto;
    font-size: 11px;
  }
</style>
