<script lang="ts">
  import uPlot from 'uplot';
  import { onMount, untrack } from 'svelte';
  import type { Lab } from '../lab/lab.svelte';
  import { cssVar, S, tr, ui } from '../ui/ui.svelte';
  import { si, time } from '../ui/format';
  import { renderMath } from '../ui/markdown';

  let { lab }: { lab: Lab } = $props();

  let host: HTMLDivElement;
  let plot: uPlot | null = null;
  let lastKey = '';
  let dragging = false;

  const BUCKETS = 240;
  /** Sketched prediction, one sample per time bucket so redrawing overwrites. */
  let sketch = new Map<number, number>();

  const shown = $derived(lab.exp.signals.filter((s) => lab.visible[s.id]));
  const hiddenId = $derived(lab.concealed ? lab.exp.predict?.signal : undefined);
  const primary = $derived(shown.find((s) => s.id === lab.fan?.signal) ?? shown.find((s) => s.id === lab.exp.predict?.signal) ?? shown[0]);

  /** The oscilloscope axis the prediction is sketched against. */
  const predictScale = () => lab.exp.signals.find((s) => s.id === lab.exp.predict?.signal)?.unit ?? 'V';

  function withAlpha(color: string, a: number): string {
    const m = color.match(/^#([0-9a-f]{6})$/i);
    if (!m) return color;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  /** uPlot draws gaps for null, not NaN (e.g. no solution beyond a nose point). */
  const gaps = (a: Float64Array) => (a.some((v) => !isFinite(v)) ? Array.from(a, (v) => (isFinite(v) ? v : null)) : a);

  function build(): { opts: uPlot.Options; data: uPlot.AlignedData } {
    const ink = cssVar('--muted');
    const grid = cssVar('--line');
    const series: uPlot.Series[] = [{}];
    const data: (Float64Array | (number | null)[])[] = [lab.run.t];

    for (const s of shown) {
      series.push({ stroke: cssVar(s.color), width: s.dash ? 1.5 : 2, dash: s.dash ? [5, 4] : undefined, scale: s.unit, show: s.id !== hiddenId });
      data.push(gaps(lab.run.s[s.id]));
    }
    lab.ghostRuns.forEach((g) => {
      for (const s of shown) {
        series.push({ stroke: withAlpha(cssVar(s.color), 0.6), width: 1.5, dash: [6, 5], scale: s.unit, show: s.id !== hiddenId });
        data.push(gaps(g.s[s.id]));
      }
    });
    if (primary) {
      lab.fanRuns.forEach((r, k) => {
        series.push({
          stroke: withAlpha(cssVar(primary.color), 0.18 + (0.5 * k) / Math.max(1, lab.fanRuns.length - 1)),
          width: 1.2,
          scale: primary.unit,
          show: primary.id !== hiddenId,
        });
        data.push(gaps(r.s[primary.id]));
      });
    }

    const units = [...new Set(shown.map((s) => s.unit))];
    const predictRange = lab.prediction.active && lab.exp.predict ? lab.exp.predict.yRange(lab.params) : null;
    const predictUnit = lab.exp.signals.find((s) => s.id === lab.exp.predict?.signal)?.unit;
    const scales: uPlot.Scales = { x: { time: false, range: () => [0, lab.tEnd] } };
    for (const u of units) {
      scales[u] =
        u === predictUnit && predictRange
          ? { range: () => predictRange }
          : {
              // Include zero only when the data comes near it: a frequency around 50 Hz should not be squashed against 0.
              range: (_u, min, max) => {
                const far = min > 0 ? min > 0.4 * max : max < 0 ? max < 0.4 * min : false;
                return far ? uPlot.rangeNum(min, max, 0.1, true) : uPlot.rangeNum(Math.min(min, 0), Math.max(max, 0), 0.1, true);
              },
            };
    }
    const axis = (scale: string, side: number): uPlot.Axis => ({
      scale,
      side,
      stroke: ink,
      grid: { stroke: grid, width: 1, show: side === 3 || units.length === 1 },
      ticks: { stroke: grid },
      // Wide enough for the longest tick label (e.g. "120 €/MWh").
      size: (_u, values) => Math.max(54, 20 + 7.2 * Math.max(0, ...(values ?? []).map((v) => String(v).length))),
      values: (_u, ticks) => ticks.map((v) => si(v, scale, 4)),
    });
    const axes: uPlot.Axis[] = [
      {
        stroke: ink,
        grid: { stroke: grid, width: 1 },
        ticks: { stroke: grid },
        values: (_u, ticks) => ticks.map((v) => lab.fmtT(v, 2)),
      },
      ...units.map((u, k) => axis(u, k === 0 ? 3 : 1)),
    ];

    const opts: uPlot.Options = {
      width: host.clientWidth,
      height: host.clientHeight,
      series,
      scales,
      axes,
      legend: { show: false },
      cursor: { drag: { x: false, y: false, setScale: false }, points: { show: false }, y: false },
      hooks: { draw: [drawOverlay] },
    };
    return { opts, data: data as uPlot.AlignedData };
  }

  function drawOverlay(u: uPlot) {
    const ctx = u.ctx;
    const dpr = devicePixelRatio || 1;
    // Time cursor.
    const x = u.valToPos(lab.t, 'x', true);
    ctx.save();
    ctx.strokeStyle = cssVar('--accent');
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.beginPath();
    ctx.moveTo(x, u.bbox.top);
    ctx.lineTo(x, u.bbox.top + u.bbox.height);
    ctx.stroke();
    // Sketched prediction.
    const pts = [...sketch.entries()].sort((a, b) => a[0] - b[0]);
    if (pts.length > 1 && u.scales[predictScale()]) {
      ctx.setLineDash([]);
      ctx.strokeStyle = cssVar('--ink');
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      pts.forEach(([b, y], k) => {
        const px = u.valToPos((b / BUCKETS) * lab.tEnd, 'x', true);
        const py = u.valToPos(y, predictScale(), true);
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  // Rebuild on structural change, otherwise just push new data.
  $effect(() => {
    const key = [
      shown.map((s) => s.id).join(),
      hiddenId,
      lab.ghostRuns.length,
      lab.fanRuns.length,
      lab.prediction.active,
      ui.paletteTick,
      ui.lang,
    ].join('|');
    const { opts, data } = build();
    // Drawing reads the time cursor; keep that out of this effect's dependencies.
    untrack(() => {
      if (!plot || key !== lastKey) {
        plot?.destroy();
        plot = new uPlot(opts, data, host);
        attachPointer(plot);
        lastKey = key;
      } else {
        plot.setData(data, true);
      }
    });
  });

  $effect(() => {
    void lab.t;
    plot?.redraw(false, false);
  });

  $effect(() => {
    if (!lab.prediction.active) sketch = new Map();
  });

  function attachPointer(u: uPlot) {
    const over = u.over;
    const handle = (e: PointerEvent) => {
      const rect = over.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const t = u.posToVal(px, 'x');
      if (lab.prediction.active && !lab.prediction.revealed && u.scales[predictScale()]) {
        const b = Math.round((Math.min(Math.max(t, 0), lab.tEnd) / lab.tEnd) * BUCKETS);
        const y = u.posToVal(py, predictScale());
        // Fill the gap from the previous bucket so fast strokes stay continuous.
        const prev = [...sketch.keys()].reduce((best, k) => (Math.abs(k - b) < Math.abs(best - b) ? k : best), b);
        if (dragging && prev !== b && Math.abs(prev - b) < 25) {
          const y0 = sketch.get(prev)!;
          const dir = Math.sign(b - prev);
          for (let k = prev + dir; k !== b; k += dir) sketch.set(k, y0 + ((y - y0) * (k - prev)) / (b - prev));
        }
        sketch.set(b, y);
        lab.prediction.points = [...sketch.entries()].map(([k, v]) => [(k / BUCKETS) * lab.tEnd, v]);
        u.redraw(false, false);
      } else {
        lab.setFrac(t / lab.tEnd);
      }
    };
    over.addEventListener('pointerdown', (e) => {
      dragging = false;
      over.setPointerCapture(e.pointerId);
      handle(e);
      dragging = true;
    });
    over.addEventListener('pointermove', (e) => dragging && handle(e));
    over.addEventListener('pointerup', () => (dragging = false));
    over.style.cursor = 'crosshair';
  }

  onMount(() => {
    // Resize on the next frame and ignore sub-2 px changes: resizing inside the
    // observer can toggle a scrollbar, which resizes again (a resize loop).
    let raf = 0, lastW = 0, lastH = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const w = host.clientWidth, h = host.clientHeight;
        if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
        lastW = w;
        lastH = h;
        plot?.setSize({ width: w, height: h });
      });
    });
    ro.observe(host);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      plot?.destroy();
    };
  });
</script>

<section class="panel scope">
  <header>
    <span>{tr(S.scope)}</span>
    <div class="chips">
      {#each lab.exp.signals as s (s.id)}
        <button
          class="chip"
          class:off={!lab.visible[s.id]}
          style="--c: var({s.color})"
          data-term={s.term}
          onclick={() => lab.toggleSignal(s.id)}
          onmouseenter={() => (lab.hover = s.term ?? null)}
          onmouseleave={() => (lab.hover = null)}
          title={tr(s.name)}
        >
          <i></i>{@html renderMath(s.symbol)}
          <span class="val">{s.id === hiddenId ? '?' : isFinite(lab.at(s.id)) ? si(lab.at(s.id), s.unit) : '—'}</span>
        </button>
      {/each}
    </div>
    <span class="spacer"></span>
    {#if lab.exp.predict}
      {#if !lab.prediction.active}
        <button class="btn" onclick={() => lab.startPrediction()}>✎ {tr(S.predict)}</button>
      {:else if !lab.prediction.revealed}
        <button class="btn primary" disabled={lab.prediction.points.length < 8} onclick={() => lab.reveal()}>
          {tr(S.reveal)}
        </button>
      {:else}
        <button class="btn" onclick={() => lab.endPrediction()}>{tr(S.retry)}</button>
      {/if}
    {/if}
  </header>
  {#if lab.prediction.active && !lab.prediction.revealed}
    <div class="banner">{tr(S.predicting)}</div>
  {/if}
  <div class="plot" bind:this={host}></div>
</section>

<style>
  .scope {
    min-height: 260px;
  }
  .plot {
    flex: 1;
    min-height: 0;
    margin: 6px 6px 2px 0;
    touch-action: none;
  }
  .chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--line);
    background: var(--panel-2);
    border-radius: 999px;
    padding: 1px 9px 1px 6px;
    font-size: 12px;
    color: var(--c);
  }
  .chip i {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--c);
  }
  .chip.off {
    opacity: 0.45;
  }
  .chip.off i {
    background: transparent;
    border: 1.5px solid var(--c);
  }
  .chip .val {
    color: var(--muted);
    font-family: var(--mono);
    font-size: 11px;
    min-width: 54px;
    text-align: right;
  }
  .banner {
    margin: 8px 12px 0;
    padding: 6px 10px;
    background: var(--accent-soft);
    border-radius: 6px;
    font-size: 13px;
  }
  :global(.scope .u-over) {
    touch-action: none;
  }
</style>
