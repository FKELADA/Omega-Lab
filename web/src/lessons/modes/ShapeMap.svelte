<script lang="ts">
  // The network drawn from G2ELin's topology, with the selected mode's shape at
  // each unit: an arrow whose length is the unit's relative amplitude and whose
  // direction is its phase. Arrows pointing opposite ways swing against each other.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { unitLabel, type ModesInfo } from '../../lib/models/g2data';
  import { tr } from '../../lib/ui/ui.svelte';
  import { getContext } from 'svelte';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ModesInfo);
  const zoomed = getContext<boolean>('zoomed') ?? false;
  const W = zoomed ? 640 : 320, H = zoomed ? 400 : 220, pad = 26;
  const topo = $derived(k.net.topology);
  const bounds = $derived.by(() => {
    const xs = topo.nodes.map((n) => n.x), ys = topo.nodes.map((n) => n.y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  });
  const P = (x: number, y: number) => {
    const b = bounds;
    const s = Math.min((W - 2 * pad) / Math.max(1e-9, b.x1 - b.x0), (H - 2 * pad) / Math.max(1e-9, b.y1 - b.y0));
    return [W / 2 + (x - (b.x0 + b.x1) / 2) * s, H / 2 - (y - (b.y0 + b.y1) / 2) * s];
  };
  const pos = $derived(new Map(topo.nodes.map((n) => [n.id, P(n.x, n.y)])));
  /** Units at the bus they are connected to. */
  const unitNodes = $derived(
    Object.entries(k.net.unit_bus)
      .filter(([, bus]) => pos.has(bus))
      .map(([unit, bus]) => ({ unit, at: pos.get(bus)! })),
  );
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Forme modale sur le réseau', en: 'Mode shape on the network' })}</span></header>
  {#if lab.concealed}<div class="concealed">…</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Mode shape">
      {#each topo.edges as e, j (j)}
        {@const a = pos.get(e.from)}
        {@const b = pos.get(e.to)}
        {#if a && b}<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} class="edge" class:tr={e.kind !== 'line'} />{/if}
      {/each}
      {#each topo.nodes as n (n.id)}
        {@const p = pos.get(n.id)!}
        <circle cx={p[0]} cy={p[1]} r="2.2" class="bus" />
      {/each}
      {#each unitNodes as un (un.unit)}
        {@const sh = k.shape?.[un.unit]}
        {@const amp = sh ? sh[0] : 0}
        {@const ph = sh ? (sh[1] * Math.PI) / 180 : 0}
        {@const len = 6 + 34 * amp}
        {@const inPhase = Math.cos(ph) >= 0}
        <circle cx={un.at[0]} cy={un.at[1]} r={5 + 6 * (k.sel.units[un.unit] ?? 0)} class="unit" class:a={inPhase} class:b={!inPhase} />
        {#if sh && amp > 0.05}
          <line x1={un.at[0]} y1={un.at[1]} x2={un.at[0] + len * Math.cos(ph)} y2={un.at[1] - len * Math.sin(ph)} class="arr" class:a={inPhase} class:b={!inPhase} marker-end="url(#shape-arr)" />
        {/if}
        <text x={un.at[0]} y={un.at[1] + 16} class="ul">{unitLabel(un.unit)}</text>
      {/each}
      <defs>
        <marker id="shape-arr" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="ah" /></marker>
      </defs>
    </svg>
    <p class="note">{tr({ fr: 'Flèche : amplitude et phase de l’angle de chaque unité. Violet et orange oscillent en opposition. Taille du disque : participation.', en: 'Arrow: amplitude and phase of each unit’s angle. Purple and orange swing in opposition. Disc size: participation.' })}</p>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 240px;
    display: block;
  }
  .edge {
    stroke: var(--line);
    stroke-width: 1.6;
  }
  .edge.tr {
    stroke-dasharray: 3 2;
  }
  .bus {
    fill: var(--muted);
  }
  .unit {
    stroke-width: 1.6;
    fill: var(--panel);
  }
  .unit.a,
  .arr.a {
    stroke: var(--c-p);
  }
  .unit.b,
  .arr.b {
    stroke: var(--c-R);
  }
  .arr {
    stroke-width: 2.6;
  }
  .ah {
    fill: var(--ink);
  }
  .ul {
    fill: var(--ink);
    font-size: 9px;
    text-anchor: middle;
  }
  .note {
    margin: 4px 0 0;
    font-size: 11px;
    color: var(--muted);
  }
</style>
