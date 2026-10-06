<script lang="ts">
  import type { Lab } from './lab.svelte';
  import { S, tr, ui } from '../ui/ui.svelte';
  import { renderMarkdown } from '../ui/markdown';
  import { lessons } from '../../lessons/curriculum';
  import { answers } from '../../lessons/answers';
  import { docForLesson, LINKS } from '../../atelier/links';
  import { openInAtelier } from '../../atelier/store';
  import { markStep, markVisit } from '../ui/progress.svelte';

  let { lab, onnote }: { lab: Lab; onnote?: () => void } = $props();

  let showHint = $state(false);

  const steps = $derived(lab.exp.steps);
  const step = $derived(steps[lab.stepIndex]);

  // Completion is sticky: once a check passes, the step stays done.
  $effect(() => {
    for (const s of steps)
      if (!lab.completed[s.id] && s.check?.(lab)) {
        lab.completed[s.id] = true;
        markStep(lab.exp.id, s.id);
      }
  });
  $effect(() => markVisit(lab.exp.id));

  const body = $derived((void ui.lang, renderMarkdown(tr(step.body))));
  const help = $derived(answers[lab.exp.id]?.[step.id]);
  const hint = $derived(step.hint ?? help?.hint);
  const answer = $derived(step.answer ?? help?.answer);
  const done = $derived(!!lab.completed[step.id]);
  // Bring the explanation into view when the step is completed.
  let answerBox = $state<HTMLElement>();
  $effect(() => {
    if (done && answerBox) answerBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  const lessonId = $derived(lessons.find((l) => l.experiment === lab.exp)?.id ?? '');
  function toAtelier() {
    const doc = docForLesson(lessonId, lab.params);
    if (doc) openInAtelier(doc);
  }
  const nextLesson = $derived.by(() => {
    const k = lessons.findIndex((l) => l.experiment === lab.exp);
    return k >= 0 ? lessons[k + 1] : undefined;
  });
  const go = (k: number) => {
    lab.stepIndex = Math.min(steps.length - 1, Math.max(0, k));
    showHint = false;
  };
</script>

<section class="panel lesson">
  <header>
    <span>{tr(S.step)} {lab.stepIndex + 1}/{steps.length}</span>
    {#if onnote}<button class="note-btn" onclick={onnote}>ⓘ {tr({ fr: 'Note pédagogique', en: 'Teaching note' })}</button>{/if}
    {#if LINKS[lessonId]}
      <button class="note-btn atelier" onclick={toAtelier} title={tr({ fr: 'Ouvrir ce montage dans l’Atelier, avec les réglages actuels', en: 'Open this set-up in the Workbench, with the current settings' })}>🛠 {tr({ fr: 'Ouvrir dans l’Atelier', en: 'Open in the Workbench' })}</button>
    {/if}
    <span class="spacer"></span>
    <div class="dots">
      {#each steps as s, k (s.id)}
        <button
          class="dot"
          class:done={lab.completed[s.id]}
          class:cur={k === lab.stepIndex}
          title={tr(s.title)}
          aria-label={tr(s.title)}
          onclick={() => go(k)}
        ></button>
      {/each}
    </div>
  </header>
  <div class="body scroll">
    <h2>
      {tr(step.title)}
      {#if lab.completed[step.id]}<span class="badge">✓ {tr(S.done)}</span>{/if}
    </h2>
    <div class="md">{@html body}</div>

    {#if step.predict && lab.exp.predict}
      <div class="predict">
        {#if !lab.prediction.active}
          <button class="btn primary" onclick={() => lab.startPrediction()}>✎ {tr(S.predict)}</button>
        {:else if !lab.prediction.revealed}
          <span class="muted">{tr(S.predicting)}</span>
        {:else}
          <div class="score">
            {tr(S.score)} <b>{lab.prediction.score} %</b>
            <button class="btn" onclick={() => lab.endPrediction()}>{tr(S.retry)}</button>
          </div>
          {#if lab.prediction.feedback}
            <div class="feedback">{@html renderMarkdown(tr(lab.prediction.feedback))}</div>
          {/if}
        {/if}
      </div>
    {/if}

    {#if done && answer}
      <div class="answer" bind:this={answerBox}>
        <h3>✓ {tr({ fr: 'Ce qu’il fallait voir', en: 'What to take away' })}</h3>
        {@html renderMarkdown(tr(answer))}
      </div>
    {:else if hint}
      <button class="link" onclick={() => (showHint = !showHint)}>{showHint ? '▾' : '▸'} {tr(S.hint)}</button>
      {#if showHint}<div class="hintbox">{@html renderMarkdown(tr(hint))}</div>{/if}
    {/if}
  </div>
  <footer>
    <button class="btn" disabled={lab.stepIndex === 0} onclick={() => go(lab.stepIndex - 1)}>← {tr(S.prev)}</button>
    {#if lab.stepIndex === steps.length - 1 && nextLesson}
      <a class="btn" class:primary={lab.completed[step.id]} href="#{nextLesson.id}">{nextLesson.id} {tr(nextLesson.title)} →</a>
    {:else}
      <button
        class="btn"
        class:primary={lab.completed[step.id]}
        disabled={lab.stepIndex === steps.length - 1}
        onclick={() => go(lab.stepIndex + 1)}>{tr(S.next)} →</button
      >
    {/if}
  </footer>
</section>

<style>
  .lesson {
    flex: 1;
  }
  .note-btn {
    border: 1px solid var(--accent);
    background: var(--accent-soft);
    color: var(--ink);
    border-radius: 999px;
    padding: 1px 10px;
    font-size: 11.5px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
  }
  .scroll {
    overflow-y: auto;
  }
  h2 {
    font-size: 16px;
    margin: 0 0 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .badge {
    font-size: 11px;
    font-weight: 600;
    color: var(--good);
    background: var(--good-soft);
    border-radius: 999px;
    padding: 1px 8px;
  }
  .md :global(p) {
    margin: 0 0 8px;
  }
  .md :global(ul) {
    margin: 0 0 8px;
    padding-left: 18px;
  }
  .dots {
    display: flex;
    gap: 5px;
  }
  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1.5px solid var(--faint);
    background: transparent;
    padding: 0;
  }
  .dot.done {
    background: var(--good);
    border-color: var(--good);
  }
  .dot.cur {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .predict {
    margin: 6px 0 10px;
  }
  .muted {
    color: var(--muted);
    font-size: 13px;
  }
  .score {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .score b {
    font-size: 18px;
    color: var(--accent);
  }
  .feedback {
    margin-top: 8px;
    padding: 8px 10px;
    border-left: 3px solid var(--warn);
    background: var(--warn-soft);
    border-radius: 4px;
    font-size: 13px;
  }
  .feedback :global(p) {
    margin: 0;
  }
  .link {
    border: none;
    background: none;
    color: var(--accent);
    padding: 0;
    font-size: 13px;
  }
  .hintbox {
    margin-top: 6px;
    padding: 6px 10px;
    background: var(--panel-2);
    border-radius: 6px;
    font-size: 13px;
  }
  .hintbox :global(p) {
    margin: 0;
  }
  .answer {
    margin-top: 8px;
    padding: 8px 12px;
    border-left: 3px solid var(--good);
    background: var(--good-soft);
    border-radius: 4px;
    font-size: 13px;
  }
  .answer h3 {
    margin: 0 0 4px;
    font-size: 12.5px;
    color: var(--good);
  }
  .answer :global(p) {
    margin: 0 0 6px;
  }
  .answer :global(p:last-child) {
    margin-bottom: 0;
  }
  .answer :global(.katex-display) {
    margin: 6px 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  a.btn {
    text-decoration: none;
    color: inherit;
  }
  a.btn.primary {
    color: var(--accent-ink);
  }
  footer {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid var(--line);
  }
</style>
