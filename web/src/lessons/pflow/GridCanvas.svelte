<script lang="ts">
  // The four-bus network of Module 5: generators at 1 (slack) and 2 (PV), loads
  // at 3 and 4, five lines. Shows |V|∠θ at each bus and the active power on each
  // line (arrow in the direction of flow, width by loading). Hovering a line or a
  // bus highlights its entries in the Y matrix.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { BranchFlow, BusType } from '../../lib/core/powerflow';
  import { NET } from '../../lib/models/module5';
  import { tr, type L } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let {
    lab,
    title,
    status = null,
    bad = false,
    V,
    th,
    flows,
    Qg,
    types,
    qLimited = [false, false, false, false],
    out = -1,
    loads,
    B4 = 0,
  }: {
    lab: Lab;
    title: L;
    status?: L | null;
    bad?: boolean;
    V: number[];
    th: number[];
    flows: BranchFlow[];
    Qg: number[];
    types: BusType[];
    qLimited?: boolean[];
    out?: number;
    loads: [number, number];
    B4?: number;
  } = $props();

  const pos = [
    { x: 112, y: 52 },
    { x: 288, y: 52 },
    { x: 112, y: 168 },
    { x: 288, y: 168 },
  ];
  const typeLabel: Record<BusType, L> = {
    slack: { fr: 'bilan', en: 'slack' },
    pv: { fr: 'PV', en: 'PV' },
    pq: { fr: 'PQ', en: 'PQ' },
  };
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
  const ok = (v: number) => isFinite(v);
  const deg = 180 / Math.PI;

  /** Arrow at the middle of a line, pointing in the direction of P. */
  function arrow(k: number) {
    const l = NET.lines[k], f = flows[k];
    const a = pos[l.from], b = pos[l.to];
    const sgn = f && f.Pij < 0 ? -1 : 1;
    const dx = (b.x - a.x) * sgn, dy = (b.y - a.y) * sgn;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return { mx, my, d: `M${mx - 7 * ux - 5 * uy},${my - 7 * uy + 5 * ux} L${mx + 7 * ux},${my + 7 * uy} L${mx - 7 * ux + 5 * uy},${my - 7 * uy - 5 * ux}` };
  }
  /** Where to put the MW label: offset perpendicular to the line. */
  function labelPos(k: number) {
    const l = NET.lines[k];
    const a = pos[l.from], b = pos[l.to];
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    if (a.y === b.y) return { x: mx, y: my - 9 };
    if (a.x === b.x) return { x: mx + (a.x < 200 ? -26 : 26), y: my + 4 };
    return { x: mx + 12, y: my + 19 };
  }
</script>

<section class="panel">
  <header>
    <span>{tr(title)}</span>
    <span class="spacer"></span>
    {#if status}<span class="status" class:bad>{tr(status)}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" role="img" aria-label="Four-bus network">
      <!-- lines -->
      {#each NET.lines as l, k (k)}
        {@const a = pos[l.from]}
        {@const b = pos[l.to]}
        {@const f = flows[k]}
        {@const w = f && ok(f.Pij) ? 1.5 + Math.min(5, Math.abs(f.Pij) * 3) : 2}
        <g
          class="line"
          class:off={k === out}
          class:hot={lab.hover === `l${k}`}
          role="presentation"
          onmouseenter={enter(`l${k}`)}
          onmouseleave={leave}
        >
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class="hit" />
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} class="wire" style="stroke-width: {w}" />
          {#if k !== out && f && ok(f.Pij) && !lab.concealed}
            {@const ar = arrow(k)}
            {@const lp = labelPos(k)}
            <path d={ar.d} class="arrow" />
            <text x={lp.x} y={lp.y} class="flow">{num(Math.abs(f.Pij) * 100, 3)} MW</text>
          {/if}
          {#if k === out}
            <text x={labelPos(k).x} y={labelPos(k).y} class="flow off-t">✕</text>
          {/if}
        </g>
      {/each}

      <!-- generators -->
      {#each [0, 1] as g (g)}
        {@const p = pos[g]}
        {@const gx = g === 0 ? p.x - 52 : p.x + 52}
        <line x1={p.x} y1={p.y} x2={gx} y2={p.y} class="stub" />
        <circle cx={gx} cy={p.y} r="13" class="gen" />
        <path d="M{gx - 7},{p.y} c2.5,-7 5,-7 7,0 s4.5,7 7,0" class="sym" />
        {#if !lab.concealed && ok(Qg[g])}
          <text x={gx} y={p.y + 27} class="small" class:lim={qLimited[g]}>Q = {num(Qg[g] * 100, 3)} Mvar</text>
        {/if}
      {/each}

      <!-- loads -->
      {#each [2, 3] as b, j (b)}
        {@const p = pos[b]}
        {@const lx = b === 2 ? p.x - 66 : p.x + 66}
        <line x1={p.x} y1={p.y} x2={lx} y2={p.y} class="stub" />
        <path d="M{lx},{p.y} v14 m-7,-7 l7,9 l7,-9" class="load" />
        <text x={lx} y={p.y + 30} class="small">{num(loads[j] * 100, 3)} MW</text>
      {/each}
      {#if B4 > 0.005}
        <line x1={pos[3].x + 14} y1={pos[3].y} x2={pos[3].x + 14} y2={pos[3].y + 22} class="stub" />
        <line x1={pos[3].x + 6} y1={pos[3].y + 22} x2={pos[3].x + 22} y2={pos[3].y + 22} class="cap" />
        <line x1={pos[3].x + 6} y1={pos[3].y + 27} x2={pos[3].x + 22} y2={pos[3].y + 27} class="cap" />
      {/if}

      <!-- buses -->
      {#each pos as p, i (i)}
        <g class="bus" class:hot={lab.hover === `b${i}`} role="presentation" onmouseenter={enter(`b${i}`)} onmouseleave={leave}>
          <line x1={p.x - 20} y1={p.y} x2={p.x + 20} y2={p.y} class="bar" />
          <text x={p.x} y={i < 2 ? p.y - 24 : p.y + 22} class="name">{i + 1} · {tr(typeLabel[types[i]])}</text>
          {#if !lab.concealed}
            <text x={p.x} y={i < 2 ? p.y - 11 : p.y + 35} class="v" class:low={ok(V[i]) && (V[i] < 0.95 || V[i] > 1.05)}>
              {ok(V[i]) ? `${num(V[i], 3)}∠${num(Math.abs(th[i] * deg) < 0.05 ? 0 : th[i] * deg, 3)}°` : '—'}
            </text>
          {/if}
        </g>
      {/each}
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 240px;
    display: block;
  }
  text {
    text-anchor: middle;
  }
  .status {
    color: var(--good);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .status.bad {
    color: var(--warn);
  }
  .hit {
    stroke: transparent;
    stroke-width: 14;
  }
  .wire {
    stroke: var(--c-C);
    stroke-linecap: round;
  }
  .line.hot .wire {
    stroke: var(--accent);
  }
  .line.off .wire {
    stroke: var(--muted);
    stroke-dasharray: 5 5;
    stroke-width: 1.5 !important;
  }
  .arrow {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2.4;
    stroke-linejoin: round;
  }
  .flow {
    fill: var(--c-p);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .off-t {
    fill: var(--warn);
    font-size: 14px;
  }
  .bar {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .bus.hot .bar {
    stroke: var(--accent);
  }
  .stub {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .gen {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2.2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .load {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .name {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .v.low {
    fill: var(--warn);
    font-weight: 700;
  }
  .small {
    fill: var(--muted);
    font-size: 9.5px;
    font-family: var(--mono);
  }
  .small.lim {
    fill: var(--warn);
    font-weight: 700;
  }
</style>
