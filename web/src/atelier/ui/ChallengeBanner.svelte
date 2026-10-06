<script lang="ts">
  // The current challenge: its statement, the objective measured live on the
  // simulation, a hint, and the explanation once the objective is met.
  import type { Bench } from '../bench.svelte';
  import { markDone } from '../done';
  import { renderMarkdown } from '../../lib/ui/markdown';
  import { tr, ui } from '../../lib/ui/ui.svelte';

  let { bench }: { bench: Bench } = $props();
  const c = $derived(bench.challenge!);
  const g = $derived(c.goal({ run: bench.lab.run, p: bench.lab.params, net: bench.compiled.net }));
  let hint = $state(false);
  $effect(() => {
    if (g.ok) markDone(c.id);
  });
  const md = (s: string) => (void ui.lang, renderMarkdown(s));
</script>

<section class="challenge" class:ok={g.ok}>
  <div class="head">
    <span class="tag">🎯 {tr({ fr: 'Défi', en: 'Challenge' })}</span>
    <b>{tr(c.name)}</b>
    <span class="spacer"></span>
    <button class="btn" onclick={() => bench.startChallenge(c.id)}>↺ {tr({ fr: 'Recommencer', en: 'Restart' })}</button>
    <button class="btn" onclick={() => bench.leaveChallenge()}>✕ {tr({ fr: 'Quitter le défi', en: 'Leave challenge' })}</button>
  </div>
  <div class="md">{@html md(tr(c.statement))}</div>
  <div class="status">
    <span class="mark">{g.ok ? '✓' : '…'}</span>
    <span>{tr(g.status)}</span>
    {#if !g.ok}<button class="link" onclick={() => (hint = !hint)}>{hint ? '▾' : '▸'} {tr({ fr: 'Indice', en: 'Hint' })}</button>{/if}
  </div>
  {#if g.ok}
    <div class="answer md">{@html md(tr(c.answer))}</div>
  {:else if hint}
    <div class="hint md">{@html md(tr(c.hint))}</div>
  {/if}
  <p class="lock">🔒 {tr({ fr: 'Les éléments verrouillés ne peuvent être ni déplacés ni supprimés ; seuls certains de leurs réglages sont ouverts. Vous pouvez ajouter les vôtres.', en: 'Locked elements cannot be moved or deleted; only some of their settings are open. You may add your own.' })}</p>
</section>

<style>
  .challenge {
    border: 1px solid var(--accent);
    background: var(--accent-soft);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 13px;
  }
  .challenge.ok {
    border-color: var(--good);
    background: var(--good-soft);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .tag {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .spacer {
    flex: 1;
  }
  .md :global(p) {
    margin: 4px 0;
  }
  .status {
    display: flex;
    gap: 8px;
    align-items: center;
    font-family: var(--mono);
    font-size: 12px;
  }
  .mark {
    font-weight: 700;
  }
  .ok .mark {
    color: var(--good);
  }
  .link {
    border: none;
    background: none;
    color: var(--accent);
    padding: 0;
    font: inherit;
    font-family: var(--sans, sans-serif);
  }
  .answer,
  .hint {
    margin-top: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--panel);
  }
  .answer {
    border-left: 3px solid var(--good);
  }
  .lock {
    margin: 6px 0 0;
    font-size: 11px;
    color: var(--muted);
  }
</style>
