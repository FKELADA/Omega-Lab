<script lang="ts">
  // Open-loop Bode diagram with the gain and phase margins marked.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { loopL, type LoopInfo } from '../../lib/models/module3';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 250, M = { l: 40, r: 8, t: 8, b: 20 }, GAP = 14;
  const wa = 1e-2, wb = 1e4;
  const k = $derived(lab.info as LoopInfo);
  const hh = (H - M.t - M.b - GAP) / 2;
  const X = (w: number) => M.l + ((W - M.l - M.r) * Math.log(w / wa)) / Math.log(wb / wa);
  const dbMin = -80, dbMax = 50;
  const Ydb = (d: number) => M.t + (hh * (dbMax - Math.max(dbMin, Math.min(dbMax, d)))) / (dbMax - dbMin);
  const Yph = (p: number) => M.t + hh + GAP + (hh * (0 - Math.max(-270, Math.min(0, p)))) / 270;
  const ws = Array.from({ length: 301 }, (_, j) => wa * (wb / wa) ** (j / 300));
  const curves = $derived.by(() => {
    let dm = '', dp = '';
    ws.forEach((w, j) => {
      const L = loopL(lab.params, w);
      const db = 20 * Math.log10(Math.hypot(L.re, L.im));
      const ph = -[lab.params.a, lab.params.b, lab.params.c].reduce((s, q) => s + Math.atan(w / q), 0) * (180 / Math.PI);
      dm += `${j ? 'L' : 'M'}${X(w).toFixed(1)},${Ydb(db).toFixed(1)}`;
      dp += `${j ? 'L' : 'M'}${X(w).toFixed(1)},${Yph(ph).toFixed(1)}`;
    });
    return { dm, dp };
  });
  const gmDb = $derived(20 * Math.log10(k.gm));
</script>

<section class="panel">
  <header><span>Bode · <span class="nocase">L(jω)</span></span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Bode diagram">
      {#each [40, 20, 0, -20, -40, -60] as d (d)}
        <line x1={M.l} x2={W - M.r} y1={Ydb(d)} y2={Ydb(d)} class="grid" class:zero={d === 0} />
        <text x={M.l - 4} y={Ydb(d) + 3} class="tick" text-anchor="end">{d}</text>
      {/each}
      {#each [0, -90, -180, -270] as p (p)}
        <line x1={M.l} x2={W - M.r} y1={Yph(p)} y2={Yph(p)} class="grid" class:zero={p === -180} />
        <text x={M.l - 4} y={Yph(p) + 3} class="tick" text-anchor="end">{p}°</text>
      {/each}
      {#each [1e-2, 1e-1, 1, 10, 100, 1e3, 1e4] as w (w)}
        <line x1={X(w)} x2={X(w)} y1={M.t} y2={H - M.b} class="grid" />
        <text x={X(w)} y={H - 6} class="tick">{w}</text>
      {/each}
      <text x={M.l + 4} y={M.t + 10} class="unit" text-anchor="start">dB</text>
      <text x={W - M.r - 2} y={H - 6} class="unit" text-anchor="end">rad/s</text>

      <path d={curves.dm} class="curve" />
      <path d={curves.dp} class="curve ph" />

      {#if k.wc !== null && k.pm !== null}
        <line x1={X(k.wc)} x2={X(k.wc)} y1={Ydb(0)} y2={Yph(-180 + k.pm)} class="mk" />
        <line x1={X(k.wc)} x2={X(k.wc)} y1={Yph(-180)} y2={Yph(-180 + k.pm)} class="pm" class:bad={k.pm < 0} />
        <text x={X(k.wc) + 4} y={Yph(-180 + k.pm / 2) + 3} class="lab" class:bad={k.pm < 0} text-anchor="start">PM {num(k.pm, 3)}°</text>
      {/if}
      <line x1={X(k.w180)} x2={X(k.w180)} y1={Ydb(0)} y2={Ydb(-gmDb)} class="gm" class:bad={k.gm < 1} />
      <text x={X(k.w180) + 4} y={Ydb(-gmDb / 2) + 3} class="lab" class:bad={k.gm < 1} text-anchor="start">GM {num(gmDb, 3)} dB</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 260px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .grid {
    stroke: var(--line);
  }
  .grid.zero {
    stroke: var(--faint);
  }
  .tick,
  .unit {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .curve {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2;
  }
  .curve.ph {
    stroke: var(--c-v1);
  }
  .mk {
    stroke: var(--faint);
    stroke-dasharray: 2 3;
  }
  .pm,
  .gm {
    stroke: var(--good);
    stroke-width: 3;
  }
  .pm.bad,
  .gm.bad {
    stroke: var(--warn);
  }
  .lab {
    fill: var(--good);
    font-size: 10.5px;
    font-weight: 700;
    font-family: var(--mono);
  }
  .lab.bad {
    fill: var(--warn);
  }
</style>
