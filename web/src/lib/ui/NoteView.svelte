<script lang="ts">
  // The pedagogical note of a module: what it is about, its objective, its path,
  // then each lesson's note — summary, objective, formulas in plain words, the
  // objective of each exercise, and the tests that guarantee the physics.
  import { curriculum } from '../../lessons/curriculum';
  import { lessonNotes, moduleNotes } from '../../lessons/notes';
  import { renderMarkdown, renderMath } from './markdown';
  import { tr, ui, type L } from './ui.svelte';

  let { module: n, focus, onclose }: { module: number; focus?: string; onclose: () => void } = $props();

  const mod = $derived(curriculum.find((m) => m.n === n)!);
  const note = $derived(moduleNotes[n]);
  let open = $state<Record<string, boolean>>({});
  $effect(() => {
    if (focus) open[focus] = true;
  });

  const md = (l: L) => (void ui.lang, renderMarkdown(tr(l)));
  const T = {
    title: { fr: 'Note pédagogique', en: 'Teaching note' },
    objective: { fr: 'Objectif', en: 'Objective' },
    path: { fr: 'Parcours', en: 'Path' },
    formulas: { fr: 'Les formules, en mots simples', en: 'The formulas, in plain words' },
    exercises: { fr: 'Les exercices et leur objectif', en: 'The exercises and what each is for' },
    tests: { fr: 'Ce que vérifient les tests automatiques', en: 'What the automated tests check' },
    why: { fr: 'Pourquoi', en: 'Why' },
    soon: { fr: 'Leçon à venir.', en: 'Lesson coming soon.' },
    open: { fr: 'Ouvrir la leçon', en: 'Open the lesson' },
  } satisfies Record<string, L>;

  function scrollFocus(node: HTMLElement, id: string | undefined) {
    if (id && node.dataset.lesson === id) setTimeout(() => node.scrollIntoView({ block: 'start' }), 50);
  }
</script>

<div class="scrim" role="presentation" onclick={onclose}></div>
<div class="modal" role="dialog" aria-modal="true" aria-label={tr(T.title)}>
  <header>
    <div>
      <div class="kicker">{tr(T.title)} · Module {n}</div>
      <h2>{tr(mod.title)}</h2>
    </div>
    <button class="btn" onclick={onclose} aria-label="Close">✕</button>
  </header>
  <div class="content">
    {#if note}
      <div class="md lead">{@html md(note.summary)}</div>
      <div class="box">
        <h4>{tr(T.objective)}</h4>
        <div class="md">{@html md(note.objective)}</div>
        <h4>{tr(T.path)}</h4>
        <div class="md">{@html md(note.path)}</div>
      </div>
    {/if}

    {#each mod.lessons as l (l.id)}
      {@const ln = lessonNotes[l.id]}
      <section class="lesson" data-lesson={l.id} use:scrollFocus={focus}>
        <button class="lh" aria-expanded={!!open[l.id]} onclick={() => (open[l.id] = !open[l.id])}>
          <span class="id">{l.id}</span>
          <span class="lt">{tr(l.title)}</span>
          <span class="chev">{open[l.id] ? '▾' : '▸'}</span>
        </button>
        {#if open[l.id]}
          {#if !ln || !l.experiment}
            <p class="soon">{tr(T.soon)}</p>
          {:else}
            <div class="md">{@html md(ln.summary)}</div>
            <div class="box">
              <h4>{tr(T.objective)}</h4>
              <div class="md">{@html md(ln.objective)}</div>
            </div>

            <h4>{tr(T.formulas)}</h4>
            <ul class="formulas">
              {#each ln.formulas as f, j (j)}
                <li>
                  <div class="tex">{@html renderMath(f.tex, true)}</div>
                  <div class="md">{@html md(f.meaning)}</div>
                </li>
              {/each}
            </ul>

            <h4>{tr(T.exercises)}</h4>
            <ol class="exercises">
              {#each l.experiment.steps as s, j (s.id)}
                <li>
                  <b>{tr(s.title)}</b>
                  {#if ln.exercises[j]}<span class="md inline">{@html md(ln.exercises[j])}</span>{/if}
                </li>
              {/each}
            </ol>

            <h4>{tr(T.tests)}</h4>
            <ul class="tests">
              {#each ln.tests as t, j (j)}
                <li>
                  <div class="md">{@html md(t.what)}</div>
                  <div class="why"><span>{tr(T.why)} :</span> <span class="md inline">{@html md(t.why)}</span></div>
                </li>
              {/each}
            </ul>
            <a class="btn primary go" href="#{l.id}" onclick={onclose}>{tr(T.open)} {l.id} →</a>
          {/if}
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
  .scrim {
    position: fixed;
    inset: 0;
    background: rgba(10, 12, 18, 0.4);
    z-index: 50;
  }
  .modal {
    position: fixed;
    top: 4vh;
    left: 50%;
    transform: translateX(-50%);
    width: min(820px, 94vw);
    max-height: 92vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    z-index: 51;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 20px 10px;
    border-bottom: 1px solid var(--line);
  }
  .kicker {
    font-size: 12px;
    color: var(--accent);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 20px;
  }
  .content {
    overflow-y: auto;
    padding: 12px 20px 24px;
  }
  .lead {
    font-size: 15px;
  }
  .box {
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 4px 14px 8px;
    margin: 10px 0;
  }
  h4 {
    margin: 12px 0 4px;
    font-size: 13px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .md :global(p) {
    margin: 4px 0;
  }
  .inline :global(p) {
    display: inline;
  }
  .lesson {
    border-top: 1px solid var(--line);
    padding: 6px 0;
  }
  .lh {
    display: flex;
    gap: 10px;
    width: 100%;
    align-items: center;
    background: none;
    border: none;
    text-align: left;
    padding: 8px 4px;
    font-size: 15px;
    font-weight: 600;
  }
  .lh:hover {
    color: var(--accent);
  }
  .id {
    font-family: var(--mono);
    color: var(--accent);
    min-width: 32px;
  }
  .lt {
    flex: 1;
  }
  .chev {
    color: var(--faint);
  }
  .soon {
    color: var(--faint);
    margin: 4px 0 8px 42px;
  }
  .formulas,
  .tests {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .formulas li {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    padding: 4px 0;
    border-bottom: 1px dashed var(--line);
  }
  .tex {
    overflow-x: auto;
  }
  .exercises {
    margin: 0;
    padding-left: 22px;
  }
  .exercises li {
    margin: 4px 0;
  }
  .exercises b {
    margin-right: 6px;
  }
  .tests li {
    padding: 6px 10px;
    margin: 6px 0;
    border-left: 3px solid var(--good);
    background: var(--good-soft);
    border-radius: 0 6px 6px 0;
  }
  .why {
    font-size: 13px;
    color: var(--muted);
  }
  .why > span:first-child {
    font-weight: 600;
  }
  .go {
    margin-top: 10px;
    text-decoration: none;
    color: var(--accent-ink);
  }
  @media (max-width: 640px) {
    .formulas li {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
