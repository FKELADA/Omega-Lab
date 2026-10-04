<script lang="ts">
  // Harmonic spectrum (relative to the fundamental), THD, and a button to hear the
  // waveform — pitched up so the ear can follow it.
  import { onDestroy } from 'svelte';
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { H_MAX, type FourierInfo } from '../../lib/models/module2b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 360, H = 170, M = { l: 34, r: 8, t: 10, b: 22 };
  const k = $derived(lab.info as FourierInfo);
  const rel = $derived(k.b.map((b) => Math.abs(b) / (Math.abs(k.b[1]) || 1)));
  const bw = (W - M.l - M.r) / H_MAX;
  const X = (n: number) => M.l + (n - 1) * bw;
  const Y = (r: number) => M.t + (H - M.t - M.b) * (1 - r);

  let ctx: AudioContext | null = null;
  let playing = $state(false);
  const PITCH = 220;

  function listen() {
    lab.flags.listened = true;
    try {
      ctx ??= new AudioContext();
      const real = new Float32Array(lab.params.N + 1);
      const imag = new Float32Array(lab.params.N + 1);
      for (let n = 1; n <= lab.params.N; n++) imag[n] = k.b[n];
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(ctx.createPeriodicWave(real, imag));
      osc.frequency.value = PITCH;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.15, ctx.currentTime + 1.1);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.3);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.35);
      playing = true;
      osc.onended = () => (playing = false);
    } catch {
      /* no audio available (e.g. headless) */
    }
  }
  onDestroy(() => ctx?.close());
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Spectre', en: 'Spectrum' })}</span>
    <span class="spacer"></span>
    <button class="btn listen" onclick={listen} disabled={playing}>♪ {tr({ fr: 'Écouter', en: 'Listen' })}</button>
  </header>
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Harmonic spectrum">
      {#each [0, 0.25, 0.5, 0.75, 1] as g (g)}
        <line x1={M.l} x2={W - M.r} y1={Y(g)} y2={Y(g)} class="grid" />
        <text x={M.l - 4} y={Y(g) + 3} class="tick" text-anchor="end">{g * 100}%</text>
      {/each}
      {#each rel.slice(1) as r, j (j)}
        {@const n = j + 1}
        {#if r > 1e-9}
          <rect x={X(n) + 1} y={Y(Math.min(1, r))} width={bw - 2} height={Y(0) - Y(Math.min(1, r))} class="bar" class:on={n <= lab.params.N} class:fund={n === 1} />
        {/if}
      {/each}
      {#each [1, 5, 7, 11, 13, 25, 49] as n (n)}
        <text x={X(n) + bw / 2} y={H - 8} class="tick">{n}</text>
      {/each}
    </svg>
    <div class="thd">
      <span>THD = <b>{num(100 * k.thd, 3)} %</b></span>
      <span>{tr({ fr: 'avec N harmoniques', en: 'with N harmonics' })} : <b>{num(100 * k.thdPartial, 3)} %</b></span>
    </div>
    <div class="note">{tr({ fr: `Le son est joué à ${PITCH} Hz (au lieu de 50 Hz) pour être audible.`, en: `Played at ${PITCH} Hz (instead of 50 Hz) so you can hear it.` })}</div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 190px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .bar {
    fill: var(--faint);
    opacity: 0.35;
  }
  .bar.on {
    fill: var(--c-p);
    opacity: 1;
  }
  .bar.fund {
    fill: var(--c-v1);
  }
  .thd {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 12.5px;
  }
  .thd b {
    font-family: var(--mono);
  }
  .note {
    font-size: 11px;
    color: var(--faint);
  }
  .listen {
    text-transform: none;
    letter-spacing: 0;
  }
</style>
