<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Lab } from './lab.svelte';
  import type { ParamSpec } from './types';
  import { S, tr } from '../ui/ui.svelte';
  import { si } from '../ui/format';
  import { renderMath } from '../ui/markdown';

  let { lab }: { lab: Lab } = $props();

  const STEPS = 1000;
  const toPos = (p: ParamSpec, v: number) =>
    p.scale === 'log'
      ? (STEPS * Math.log(v / p.min)) / Math.log(p.max / p.min)
      : (STEPS * (v - p.min)) / (p.max - p.min);
  const fromPos = (p: ParamSpec, x: number) => {
    const f = x / STEPS;
    const v = p.scale === 'log' ? p.min * (p.max / p.min) ** f : p.min + (p.max - p.min) * f;
    return p.step ? Math.round(v / p.step) * p.step : +v.toPrecision(3);
  };

  // Playback: sweeps the time cursor across the window in about six seconds.
  let raf = 0;
  let last = 0;
  function frame(now: number) {
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    const f = lab.frac + dt / 6;
    lab.setFrac(f);
    if (f >= 1) {
      lab.playing = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function togglePlay() {
    if (lab.playing) {
      lab.playing = false;
      cancelAnimationFrame(raf);
      return;
    }
    if (lab.frac >= 0.999) lab.setFrac(0);
    lab.playing = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  onDestroy(() => cancelAnimationFrame(raf));
</script>

<section class="rail panel">
  <div class="time">
    <button class="btn play" onclick={togglePlay} aria-label={lab.playing ? tr(S.pause) : tr(S.play)}>
      {lab.playing ? '❚❚' : '▶'}
    </button>
    <label class="tlabel" for="tcursor">{tr(S.time)}</label>
    <input
      id="tcursor"
      type="range"
      min="0"
      max="1000"
      value={lab.frac * 1000}
      oninput={(e) => lab.setFrac(+e.currentTarget.value / 1000)}
    />
    <span class="mono">{si(lab.t, 's')} / {si(lab.tEnd, 's')}</span>
  </div>

  <div class="params">
    {#each lab.exp.params as p (p.id)}
      <div
        class="param"
        style="--c: var(--c-{p.term})"
        role="group"
        aria-label={tr(p.name)}
        onmouseenter={() => (lab.hover = p.term ?? null)}
        onmouseleave={() => (lab.hover = null)}
      >
        <span class="sym" title={tr(p.name)}>{@html renderMath(p.symbol)}</span>
        {#if p.choices}
          <div class="choices" role="radiogroup" aria-label={tr(p.name)}>
            {#each p.choices as c (c.value)}
              <button
                role="radio"
                aria-checked={lab.params[p.id] === c.value}
                class:on={lab.params[p.id] === c.value}
                onclick={() => lab.setParam(p.id, c.value)}>{tr(c.label)}</button
              >
            {/each}
          </div>
        {:else}
        <input
          type="range"
          min="0"
          max={STEPS}
          value={toPos(p, lab.params[p.id])}
          aria-label={tr(p.name)}
          title={tr(S.reset)}
          oninput={(e) => lab.setParam(p.id, fromPos(p, +e.currentTarget.value))}
          ondblclick={() => lab.setParam(p.id, p.default)}
        />
        <span class="mono val">{si(lab.params[p.id], p.unit)}</span>
        {/if}
        {#if !p.choices}
        <button
          class="btn sweep"
          class:on={lab.fan?.param === p.id}
          title={tr(S.sweepTitle)}
          onclick={() => lab.sweep(p.id)}>⇶ {tr(S.sweep)}</button
        >
        {/if}
      </div>
    {/each}
  </div>

  <div class="actions">
    <button class="btn" onclick={() => lab.freeze()}>❄ {tr(S.freeze)}</button>
    <button class="btn" disabled={!lab.ghosts.length && !lab.fan} onclick={() => lab.clearGhosts()}>{tr(S.clear)}</button>
    <label class="lock">
      <input
        type="checkbox"
        checked={lab.lockedTEnd !== null}
        onchange={(e) => (lab.lockedTEnd = e.currentTarget.checked ? lab.tEnd : null)}
      />
      {tr(S.lockAxis)}
    </label>
  </div>
</section>

<style>
  .rail {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 2.4fr) auto;
    gap: 10px 22px;
    padding: 10px 14px;
    align-items: center;
  }
  .time {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .time input {
    flex: 1;
    min-width: 80px;
  }
  .tlabel {
    font-size: 12px;
    color: var(--muted);
  }
  .play {
    width: 34px;
    justify-content: center;
  }
  .params {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 4px 18px;
  }
  .param {
    display: grid;
    grid-template-columns: 18px 1fr 70px auto;
    align-items: center;
    gap: 8px;
    border-radius: 6px;
    padding: 2px 4px;
  }
  .param:hover {
    background: var(--hot);
  }
  .param:has(.choices) {
    grid-template-columns: 18px 1fr;
  }
  .choices {
    display: inline-flex;
    flex-wrap: wrap;
    border: 1px solid var(--line);
    border-radius: 7px;
    overflow: hidden;
    justify-self: start;
  }
  .choices button {
    border: none;
    background: var(--panel);
    padding: 2px 10px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .choices button + button {
    border-left: 1px solid var(--line);
  }
  .choices button.on {
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .sym {
    color: var(--c);
    font-weight: 600;
  }
  input[type='range'] {
    accent-color: var(--c, var(--accent));
    width: 100%;
  }
  .mono {
    font-family: var(--mono);
    font-size: 12px;
    white-space: nowrap;
  }
  .val {
    text-align: right;
  }
  .sweep {
    font-size: 12px;
    padding: 2px 8px;
  }
  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .lock {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--muted);
  }
  @media (max-width: 1100px) {
    .rail {
      grid-template-columns: 1fr;
    }
  }
</style>
