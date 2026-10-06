<script lang="ts">
  // Harmonic analyser: spectrum of a signal over the last whole periods of the
  // fundamental, its THD, and the EN 50160 limits for voltages.
  import { getContext } from 'svelte';
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { fundamental } from '../analyses';
  import { lastPeriods, spectrum, stats } from '../engine/harmonics';
  import { si } from '../library';
  import { parseSI } from '../units';
  import { useBench } from './context';
  import { tr, ui } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  const bench = useBench();
  const signals = $derived(lab.exp.signals.filter((s) => /\.(v|i)$/.test(s.id)));
  let chosen = $state<string | null>(null);
  let f1Typed = $state<number | null>(null);
  const sig = $derived(signals.find((s) => s.id === chosen) ?? signals.find((s) => lab.visible[s.id]) ?? signals[0]);
  const f1 = $derived(f1Typed ?? fundamental(bench.compiled.net, lab.params));
  const win = $derived(f1 ? lastPeriods(lab.run.t, f1) : null);
  const y = $derived(sig ? lab.run.s[sig.id] : null);
  const sp = $derived(win && y && f1 ? spectrum(lab.run.t, y, f1, win, 40) : null);
  const st = $derived(win && y ? stats(lab.run.t, y, win) : null);
  const isV = $derived(sig?.unit === 'V');

  /** EN 50160 limits for harmonic voltages (% of the fundamental), odd orders up to 25. */
  const EN50160: Record<number, number> = { 2: 2, 3: 5, 4: 1, 5: 6, 6: 0.5, 7: 5, 9: 1.5, 11: 3.5, 13: 3, 15: 0.5, 17: 2, 19: 1.5, 21: 0.5, 23: 1.5, 25: 1.5 };
  const NMAX = 25;
  // A larger drawing area in the enlarged window, so text keeps its size.
  const big = getContext<boolean>('zoomed') ?? false;
  const W = big ? 1000 : 420, H = big ? 420 : 150, M = { l: 34, b: 18, t: 8 };
  const bars = $derived(sp ? Array.from({ length: NMAX }, (_, k) => ({ n: k + 1, pct: (100 * sp.amp[k + 1]) / (sp.amp[1] || 1) })) : []);
  const ymax = $derived(Math.max(10, ...bars.slice(1).map((b) => b.pct)) * 1.15);
  const bx = (n: number) => M.l + ((W - M.l - 6) * (n - 0.5)) / NMAX;
  const by = (pct: number) => H - M.b - ((H - M.b - M.t) * Math.min(pct, ymax)) / ymax;
</script>

<section class="panel thd">
  <header>
    <span>{tr({ fr: 'Analyseur d’harmoniques', en: 'Harmonic analyser' })}</span>
    <span class="spacer"></span>
    {#if sp}<span class="big" class:bad={isV && sp.thd > 0.08}>THD = {(100 * sp.thd).toFixed(sp.thd < 0.1 ? 2 : 1).replace('.', ui.lang === 'fr' ? ',' : '.')} %</span>{/if}
  </header>
  <div class="body">
    <div class="bar">
      <label for="thd-sig">{tr({ fr: 'Signal', en: 'Signal' })}</label>
      <select id="thd-sig" value={sig?.id ?? ''} onchange={(e) => (chosen = e.currentTarget.value)}>
        {#each signals as s (s.id)}<option value={s.id}>{s.id}</option>{/each}
      </select>
      <label for="thd-f1">f₁</label>
      <input id="thd-f1" class="num" type="text" value={f1 ? si(f1, 'Hz') : ''} placeholder="50 Hz" onchange={(e) => (f1Typed = parseSI(e.currentTarget.value))} />
    </div>
    {#if !f1}
      <p class="msg">{tr({ fr: 'Donnez la fréquence fondamentale, ou ajoutez une source alternative.', en: 'Give the fundamental frequency, or add an AC source.' })}</p>
    {:else if !win}
      <p class="msg">{tr({ fr: 'Simulez au moins une période de la fondamentale (durée simulée, dans le panneau Projet).', en: 'Simulate at least one period of the fundamental (simulated time, in the Project panel).' })}</p>
    {:else if sp && st && sig}
      <svg viewBox="0 0 {W} {H}" role="img" aria-label="Spectrum">
        {#each [0, 0.25, 0.5, 0.75, 1] as q (q)}
          <line x1={M.l} x2={W - 4} y1={by(q * ymax)} y2={by(q * ymax)} class="grid" />
          <text x={M.l - 4} y={by(q * ymax) + 3} class="tick" text-anchor="end">{Math.round(q * ymax)} %</text>
        {/each}
        {#each bars as b (b.n)}
          {#if b.n > 1}
            <rect x={bx(b.n) - 5} width="10" y={by(b.pct)} height={H - M.b - by(b.pct)} class="hb" class:over={isV && EN50160[b.n] !== undefined && b.pct > EN50160[b.n]} />
            {#if isV && EN50160[b.n] !== undefined}<line x1={bx(b.n) - 7} x2={bx(b.n) + 7} y1={by(EN50160[b.n])} y2={by(EN50160[b.n])} class="lim" />{/if}
          {:else}
            <rect x={bx(1) - 5} width="10" y={M.t} height={H - M.b - M.t} class="fund" />
          {/if}
          {#if b.n % 2 === 1 || b.n === 2}<text x={bx(b.n)} y={H - 5} class="tick" text-anchor="middle">{b.n}</text>{/if}
        {/each}
      </svg>
      <div class="stats">
        <span>{tr({ fr: 'Fondamental', en: 'Fundamental' })} : <b>{si(sp.amp[1], sig.unit)}</b> {tr({ fr: 'crête', en: 'peak' })}</span>
        <span>{tr({ fr: 'Efficace', en: 'RMS' })} : <b>{si(st.rms, sig.unit)}</b></span>
        <span>{tr({ fr: 'Moyenne (DC)', en: 'Mean (DC)' })} : <b>{si(st.mean, sig.unit)}</b></span>
        <span>{win.periods} {tr({ fr: 'période(s) analysée(s)', en: 'period(s) analysed' })}</span>
      </div>
      <p class="note">
        {tr({
          fr: `Barres : amplitude de chaque harmonique en % du fondamental, sur les dernières périodes simulées. THD = √(Σ V²ₙ)/V₁.${isV ? ' Traits : limites EN 50160 pour la tension (THD ≤ 8 %).' : ''}`,
          en: `Bars: each harmonic’s amplitude in % of the fundamental, over the last simulated periods. THD = √(Σ V²ₙ)/V₁.${isV ? ' Ticks: EN 50160 limits for voltage (THD ≤ 8 %).' : ''}`,
        })}
      </p>
    {/if}
  </div>
</section>

<style>
  .big {
    font: 700 13px var(--mono);
    color: var(--good);
    text-transform: none;
  }
  .big.bad {
    color: var(--warn);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    margin-bottom: 6px;
  }
  select,
  .num {
    padding: 2px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel-2);
    color: var(--ink);
    font: 12px var(--mono);
  }
  .num {
    width: 84px;
  }
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    font-size: 9px;
    fill: var(--muted);
  }
  .hb {
    fill: var(--c-p);
  }
  .hb.over {
    fill: var(--warn);
  }
  .fund {
    fill: var(--faint);
  }
  .lim {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 12px;
  }
  .msg,
  .note {
    color: var(--muted);
    font-size: 12px;
  }
  .note {
    margin: 4px 0 0;
  }
</style>
