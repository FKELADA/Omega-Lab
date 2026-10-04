<script lang="ts">
  // Three-bus network at the hour under the cursor: G1 and solar at bus 1, G2
  // at bus 2, G3 and the load at bus 3. Line flows (DC), the 1–3 limit, and the
  // nodal price at each bus.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { dispatch, loadProfile, solarProfile } from '../../lib/models/module5';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const h = $derived(lab.t);
  const D = $derived(loadProfile(h, lab.params.peak));
  const r = $derived(dispatch(lab.params, D, solarProfile(h, lab.params.solar)));
  const pos = [
    { x: 110, y: 112 },
    { x: 290, y: 44 },
    { x: 290, y: 178 },
  ];
  const lines = [
    [0, 1],
    [1, 2],
    [0, 2],
  ];
  const hh = $derived(`${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}`);
  const flowLabel = (k: number) => {
    const [a, b] = lines[k];
    const mx = (pos[a].x + pos[b].x) / 2, my = (pos[a].y + pos[b].y) / 2;
    return k === 1 ? { x: mx + 34, y: my + 4 } : k === 0 ? { x: mx - 10, y: my - 12 } : { x: mx - 10, y: my + 22 };
  };
  function arrow(k: number) {
    const [a, b] = lines[k];
    const sgn = r.flows[k] < 0 ? -1 : 1;
    const dx = (pos[b].x - pos[a].x) * sgn, dy = (pos[b].y - pos[a].y) * sgn;
    const len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const mx = (pos[a].x + pos[b].x) / 2, my = (pos[a].y + pos[b].y) / 2;
    return `M${mx - 7 * ux - 5 * uy},${my - 7 * uy + 5 * ux} L${mx + 7 * ux},${my + 7 * uy} L${mx - 7 * ux + 5 * uy},${my - 7 * uy - 5 * ux}`;
  }
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Réseau à 3 nœuds', en: 'Three-bus network' })} · {hh}</span>
    <span class="spacer"></span>
    {#if r.congested}<span class="warn">{tr({ fr: 'congestion 1–3', en: '1–3 congested' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" text-anchor="middle" role="img" aria-label="Three-bus network">
      {#each lines as [a, b], k (k)}
        {@const congested = k === 2 && r.congested}
        <line x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} class="wire" class:cong={congested} style="stroke-width: {1.5 + Math.min(6, Math.abs(r.flows[k]) / 80)}" />
        {#if Math.abs(r.flows[k]) > 0.5 && !lab.concealed}
          <path d={arrow(k)} class="arrow" />
          <text x={flowLabel(k).x} y={flowLabel(k).y} class="flow" class:cong={congested}>{num(Math.abs(r.flows[k]), 3)} MW</text>
        {/if}
      {/each}
      <text x={flowLabel(2).x} y={flowLabel(2).y + 13} class="small" class:cong={r.congested}>
        {tr({ fr: 'limite', en: 'limit' })} {num(lab.params.Fmax, 3)} MW
      </text>

      <!-- buses with their nodal prices -->
      {#each pos as p, i (i)}
        <line x1={p.x - 18} y1={p.y} x2={p.x + 18} y2={p.y} class="bar" />
        {#if !lab.concealed}
          <text x={[p.x, p.x, p.x - 62][i]} y={[p.y + 26, p.y - 10, p.y + 22][i]} class="price">{num(r.lmp[i], 3)} €/MWh</text>
        {/if}
      {/each}

      <!-- units -->
      {#each [{ j: 0, x: 38, y: 82 }, { j: 3, x: 38, y: 142 }, { j: 1, x: 362, y: 44 }, { j: 2, x: 362, y: 150 }] as g (g.j)}
        {@const u = r.units[g.j]}
        {@const b = pos[u.bus]}
        <line x1={g.x + (g.x < 200 ? 16 : -16)} y1={g.y} x2={b.x + (g.x < 200 ? -18 : 18)} y2={b.y} class="stub" />
        {#if g.j === 3}
          <rect x={g.x - 14} y={g.y - 10} width="28" height="20" rx="3" class="pv" />
          <path d="M{g.x - 14},{g.y} h28 M{g.x - 5},{g.y - 10} v20 M{g.x + 5},{g.y - 10} v20" class="pvgrid" />
        {:else}
          <circle cx={g.x} cy={g.y} r="14" class="gen" class:idle={u.P < 0.5} />
          <text x={g.x} y={g.y + 4} class="gname">{u.name}</text>
        {/if}
        <text x={g.x} y={g.y + 28} class="mw" class:max={u.P > u.Pmax - 0.5 && u.Pmax > 0}>{num(u.P, 3)} MW</text>
      {/each}
      <!-- load -->
      <line x1={pos[2].x} y1={pos[2].y} x2={pos[2].x} y2={pos[2].y + 22} class="stub" />
      <path d="M{pos[2].x - 8},{pos[2].y + 14} l8,10 l8,-10" class="load" />
      <text x={pos[2].x} y={pos[2].y + 40} class="mw">{tr({ fr: 'charge', en: 'load' })} {num(D, 3)} MW</text>
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
  .warn {
    color: var(--warn);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .wire {
    stroke: var(--c-C);
    stroke-linecap: round;
  }
  .wire.cong {
    stroke: var(--warn);
  }
  .arrow {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2.4;
  }
  .flow {
    fill: var(--c-p);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .flow.cong,
  .small.cong {
    fill: var(--warn);
    font-weight: 700;
  }
  .small {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .bar {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .price {
    fill: var(--c-R);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 700;
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
  .gen.idle {
    stroke: var(--muted);
    stroke-dasharray: 3 3;
  }
  .gname {
    fill: var(--ink);
    font-size: 9.5px;
    font-weight: 700;
  }
  .pv {
    fill: var(--accent-soft);
    stroke: var(--c-i);
    stroke-width: 1.8;
  }
  .pvgrid {
    stroke: var(--c-i);
    stroke-width: 0.8;
  }
  .mw {
    fill: var(--ink);
    font-size: 10px;
    font-family: var(--mono);
  }
  .mw.max {
    fill: var(--warn);
    font-weight: 700;
  }
  .load {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
</style>
