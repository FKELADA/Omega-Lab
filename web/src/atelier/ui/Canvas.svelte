<script lang="ts">
  // The bench's free space: elements on a grid, wires between their ports, and
  // dots that travel along the wires with the charge that has flowed through
  // them (q = ∫ i dt at the time cursor), so the current is seen moving.
  import type { Bench } from '../bench.svelte';
  import { portPos, type BenchEl, type PortRef } from '../doc';
  import { DEFS, GRID, si, sigSpec } from '../library';
  import { tr } from '../../lib/ui/ui.svelte';

  let { bench, tool = 'select' }: { bench: Bench; tool?: 'select' | 'pan' } = $props();
  const lab = $derived(bench.lab);

  let svg = $state<SVGSVGElement>();
  let w = $state(800), h = $state(500);
  // View: world point at the top-left corner, and zoom.
  let vx = $state(-40), vy = $state(-40), zoom = $state(1.4);


  function world(e: { clientX: number; clientY: number }): [number, number] {
    const r = svg!.getBoundingClientRect();
    return [vx + (e.clientX - r.left) / zoom, vy + (e.clientY - r.top) / zoom];
  }
  const snap = (v: number) => Math.round(v / GRID);

  const portXY = (el: BenchEl, port: string): [number, number] => {
    const p = DEFS[el.type].ports.find((q) => q.id === port)!;
    const [x, y] = portPos(el, p.dx, p.dy);
    return [x * GRID, y * GRID];
  };
  /** Outward direction of a port is vertical? */
  const vertical = (el: BenchEl, port: string) => {
    const p = DEFS[el.type].ports.find((q) => q.id === port)!;
    const vert = Math.abs(p.dy) > Math.abs(p.dx);
    return el.rot % 180 === 0 ? vert : !vert;
  };
  function route(a: PortRef, b: PortRef): string | null {
    const ea = bench.el(a.el), eb = bench.el(b.el);
    if (!ea || !eb || !DEFS[ea.type] || !DEFS[eb.type]) return null;
    const [ax, ay] = portXY(ea, a.port), [bx, by] = portXY(eb, b.port);
    return vertical(ea, a.port) ? `M${ax},${ay} V${by} H${bx}` : `M${ax},${ay} H${bx} V${by}`;
  }

  // ── Charge displaced in each wire, for the moving dots ──
  const degree = $derived.by(() => {
    const d = new Map<string, number>();
    for (const wr of bench.doc.wires) for (const r of [wr.a, wr.b]) d.set(`${r.el}:${r.port}`, (d.get(`${r.el}:${r.port}`) ?? 0) + 1);
    return d;
  });
  const charge = $derived.by(() => {
    const run = lab.run;
    const q: Record<string, Float64Array> = {};
    let max = 0;
    for (const [sig, i] of Object.entries(run.s)) {
      if (!sig.endsWith('.i')) continue;
      const out = new Float64Array(i.length);
      for (let k = 1; k < i.length; k++) out[k] = out[k - 1] + 0.5 * (i[k] + i[k - 1]) * (run.t[k] - run.t[k - 1]);
      for (const v of out) max = Math.max(max, Math.abs(v));
      q[sig.slice(0, -2)] = out;
    }
    return { q, scale: max > 0 ? 500 / max : 0 };
  });
  /** Dot offset of a wire, or null if its current is not defined by a single element. */
  function flow(a: PortRef, b: PortRef): number | null {
    // The path runs from end a (P) to end b (Q). An element's current flows inside
    // it from its port a to its port b (sources: delivered out of a), which fixes
    // the direction of the current in a wire attached to one of its ports.
    for (const [end, atP] of [[a, true], [b, false]] as const) {
      const el = bench.el(end.el);
      const def = el && DEFS[el.type];
      if (!el || !def || !def.signals.includes('i') || (degree.get(`${end.el}:${end.port}`) ?? 0) !== 1) continue;
      const q = charge.q[end.el];
      if (!q) continue;
      let s = end.port === 'a' ? -1 : 1; // +1: charge flows P → Q
      if (!atP) s = -s;
      if (def.family === 'sources') s = -s;
      // A growing dash offset moves the dots towards the start of the path.
      return -s * q[lab.idx] * charge.scale;
    }
    return null;
  }

  // ── Interaction ──
  // Drag on an element: moves it, or the whole selection if it is part of it.
  // Drag on the background: selection rectangle (or pans the view with the
  // "pan" tool, the middle button, or Space held down).
  let drag: { ox: number; oy: number; start: Record<string, [number, number]>; moved: boolean } | null = null;
  let pan: { x: number; y: number; vx: number; vy: number } | null = null;
  let box = $state<{ x0: number; y0: number; x1: number; y1: number; add: boolean } | null>(null);
  let mouse = $state<[number, number]>([0, 0]);
  let space = false;

  const capture = (e: PointerEvent) => {
    try {
      svg!.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic event */
    }
  };
  function downEl(e: PointerEvent, el: BenchEl) {
    e.stopPropagation();
    if (e.shiftKey) {
      bench.togglePick('el', el.id);
      return;
    }
    if (!bench.isPicked('el', el.id)) bench.selection = { kind: 'el', id: el.id };
    const [x, y] = world(e);
    const start = Object.fromEntries(bench.picked.els.map((id) => bench.el(id)).filter((q) => q).map((q) => [q!.id, [q!.x, q!.y] as [number, number]]));
    drag = { ox: snap(x), oy: snap(y), start, moved: false };
    capture(e);
  }
  function downWire(e: PointerEvent, id: string) {
    e.stopPropagation();
    if (e.shiftKey) bench.togglePick('wire', id);
    else bench.selection = { kind: 'wire', id };
  }
  function downBg(e: PointerEvent) {
    if (bench.pending) {
      bench.pending = null;
      return;
    }
    if (tool === 'pan' || e.button === 1 || space) {
      pan = { x: e.clientX, y: e.clientY, vx, vy };
    } else {
      if (!e.shiftKey) bench.selection = null;
      const [x, y] = world(e);
      box = { x0: x, y0: y, x1: x, y1: y, add: e.shiftKey };
    }
    capture(e);
  }
  function move(e: PointerEvent) {
    mouse = world(e);
    if (drag) {
      const dx = snap(mouse[0]) - drag.ox, dy = snap(mouse[1]) - drag.oy;
      if (!drag.moved && !dx && !dy) return;
      if (!drag.moved) bench.beginMove();
      drag.moved = true;
      bench.moveGroup(drag.start, dx, dy);
    } else if (pan) {
      vx = pan.vx - (e.clientX - pan.x) / zoom;
      vy = pan.vy - (e.clientY - pan.y) / zoom;
    } else if (box) {
      box.x1 = mouse[0];
      box.y1 = mouse[1];
    }
  }
  function up() {
    if (box && (Math.abs(box.x1 - box.x0) > 4 || Math.abs(box.y1 - box.y0) > 4))
      bench.selectBox(box.x0 / GRID, box.y0 / GRID, box.x1 / GRID, box.y1 / GRID, box.add);
    drag = null;
    pan = null;
    box = null;
  }
  $effect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) space = e.type === 'keydown';
    };
    addEventListener('keydown', k);
    addEventListener('keyup', k);
    return () => (removeEventListener('keydown', k), removeEventListener('keyup', k));
  });
  $effect(() => {
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const [wx, wy] = world(e);
      const z = Math.min(4, Math.max(0.3, zoom * Math.exp(-e.deltaY * 0.0015)));
      vx = wx - (wx - vx) * (zoom / z);
      vy = wy - (wy - vy) * (zoom / z);
      zoom = z;
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg?.removeEventListener('wheel', onWheel);
  });

  function drop(e: DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer?.getData('text/omega-el');
    if (!type || !DEFS[type]) return;
    const [x, y] = world(e);
    bench.add(type, snap(x), snap(y));
  }
  /** Centre of the view, in grid units (where a tapped library item lands). */
  export function centre(): [number, number] {
    return [snap(vx + w / zoom / 2), snap(vy + h / zoom / 2)];
  }
  export function fit() {
    const els = bench.doc.elements;
    if (!els.length) return;
    const xs = els.map((e) => e.x * GRID), ys = els.map((e) => e.y * GRID);
    const x0 = Math.min(...xs) - 80, x1 = Math.max(...xs) + 80, y0 = Math.min(...ys) - 80, y1 = Math.max(...ys) + 80;
    zoom = Math.min(2.2, Math.max(0.4, Math.min(w / (x1 - x0), h / (y1 - y0))));
    vx = (x0 + x1) / 2 - w / zoom / 2;
    vy = (y0 + y1) / 2 - h / zoom / 2;
  }

  const pendingXY = $derived.by(() => {
    const p = bench.pending;
    const el = p && bench.el(p.el);
    return el ? portXY(el, p!.port) : null;
  });
  const isSel = (kind: 'el' | 'wire', id: string) => bench.isPicked(kind, id);
  const live = (id: string, s: string) => lab.run.s[`${id}.${s}`]?.[lab.idx];
</script>

<div class="canvas" bind:clientWidth={w} bind:clientHeight={h}>
  <svg
    bind:this={svg}
    class:pan={tool === 'pan'}
    viewBox="{vx} {vy} {w / zoom} {h / zoom}"
    role="application"
    aria-label={tr({ fr: 'Plan de travail', en: 'Workbench' })}
    onpointerdown={downBg}
    onpointermove={move}
    onpointerup={up}
    ondragover={(e) => e.preventDefault()}
    ondrop={drop}
  >
    <defs>
      <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
        <circle cx="0" cy="0" r="1" class="dot" />
      </pattern>
    </defs>
    <rect x={vx} y={vy} width={w / zoom} height={h / zoom} fill="url(#grid)" />

    {#each bench.doc.wires as wr (wr.id)}
      {@const d = route(wr.a, wr.b)}
      {#if d}
        {@const off = flow(wr.a, wr.b)}
        {@const tri = DEFS[bench.el(wr.a.el)?.type ?? '']?.ports.find((q) => q.id === wr.a.port)?.phases === 3}
        <g class="wire" class:sel={isSel('wire', wr.id)} class:tri>
          <path {d} class="hit" role="button" tabindex="-1" aria-label={wr.id} onpointerdown={(e) => downWire(e, wr.id)} />
          <path {d} class="line" />
          {#if off !== null && charge.scale > 0}<path {d} class="flow" style="stroke-dashoffset: {off}" />{/if}
        </g>
      {/if}
    {/each}

    {#each bench.doc.elements as el (el.id)}
      {@const def = DEFS[el.type]}
      {#if def}
        {@const horiz = el.rot % 180 === 0}
        {@const [bw, bh] = def.box ?? [30, 16]}
        {@const ly = horiz ? bh + 6 : bw + 6}
        <g class="el" class:sel={isSel('el', el.id)} transform="translate({el.x * GRID},{el.y * GRID})" role="button" tabindex="-1" aria-label={el.id} onpointerdown={(e) => downEl(e, el)}>
          <g transform="rotate({el.rot})">
            {#if (bench.highlight?.[el.id] ?? 0) > 0.02}
              <rect x={-bw - 4} y={-bh - 4} width={2 * bw + 8} height={2 * bh + 8} rx="10" class="glow" style="opacity: {0.12 + 0.4 * bench.highlight![el.id]}" />
            {/if}
            <rect x={-bw} y={-bh} width={2 * bw} height={2 * bh} class="hitbox" />
            {#if def.circle}<circle r="14" class="body" />{/if}
            <path d={def.symbol} class="sym" />
          </g>
          {#if def.glyph}<text class="glyph" y="5">{def.glyph}</text>{/if}
          {#if !def.ground}
            <text class="lbl id" x={horiz ? 0 : ly} y={horiz ? -ly : -4} text-anchor={horiz ? 'middle' : 'start'}>{el.id}</text>
            {#if def.label}<text class="lbl val" x={horiz ? 0 : ly} y={horiz ? ly + 8 : 10} text-anchor={horiz ? 'middle' : 'start'}>{def.label(el.params)}</text>{/if}
            {#if def.family === 'instruments'}
              {@const s = sigSpec(def.signals[0])}
              <text class="lbl meter" x={horiz ? 0 : ly} y={horiz ? ly + 8 : 10} text-anchor={horiz ? 'middle' : 'start'}>{si(live(el.id, s.id) ?? NaN, s.unit)}</text>
            {/if}
          {/if}
        </g>
        {#each def.ports as p (p.id)}
          {@const [px, py] = portXY(el, p.id)}
          {@const linked = (degree.get(`${el.id}:${p.id}`) ?? 0) > 0}
          <circle
            cx={px}
            cy={py}
            r={p.phases === 3 ? 7 : 5}
            class="port"
            class:tri={p.phases === 3}
            class:open={!linked}
            class:pend={bench.pending?.el === el.id && bench.pending.port === p.id}
            role="button"
            tabindex="-1"
            aria-label="{el.id}.{p.id}"
            onpointerdown={(e) => e.stopPropagation()}
            onclick={(e) => (e.stopPropagation(), bench.clickPort({ el: el.id, port: p.id }))}
            onkeydown={(e) => e.key === 'Enter' && bench.clickPort({ el: el.id, port: p.id })}
          />
          {#if def.ports.length > 2 || (p.label && def.ports.length === 2)}
            <text class="pm" x={px + 8} y={py - 7}>{p.label ?? p.id}</text>
          {:else if def.ports.length === 2 && !def.ground}
            <text class="pm" x={px + (horiz ? (p.id === 'a' ? 6 : -6) : 7)} y={py + (horiz ? -6 : p.id === 'a' ? 10 : -4)} text-anchor={horiz ? (p.id === 'a' ? 'start' : 'end') : 'start'}>{p.id === 'a' ? '+' : '−'}</text>
          {/if}
        {/each}
      {/if}
    {/each}

    {#if box}
      <rect x={Math.min(box.x0, box.x1)} y={Math.min(box.y0, box.y1)} width={Math.abs(box.x1 - box.x0)} height={Math.abs(box.y1 - box.y0)} class="box" />
    {/if}
    {#if pendingXY}
      <line x1={pendingXY[0]} y1={pendingXY[1]} x2={mouse[0]} y2={mouse[1]} class="rubber" />
    {/if}
  </svg>

  {#if !bench.doc.elements.length}
    <div class="empty">
      {tr({
        fr: 'Glissez des éléments depuis la bibliothèque (à droite), ou ouvrez un modèle. Cliquez sur une borne puis sur une autre pour tirer un fil.',
        en: 'Drag elements from the library (right), or open a template. Click one terminal then another to draw a wire.',
      })}
    </div>
  {/if}
  {#if bench.pending}
    <div class="tip">{tr({ fr: 'Cliquez sur une autre borne pour relier (Échap pour annuler).', en: 'Click another terminal to connect (Escape to cancel).' })}</div>
  {/if}
</div>

<style>
  .canvas {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 10px;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
    user-select: none;
  }
  .dot {
    fill: var(--faint);
  }
  .wire .line {
    stroke: var(--ink);
    stroke-width: 2;
    fill: none;
  }
  .wire .hit {
    stroke: transparent;
    stroke-width: 12;
    fill: none;
    cursor: pointer;
  }
  .wire.tri .line {
    stroke-width: 4;
  }
  .port.tri {
    stroke-width: 2.5;
  }
  .wire.sel .line {
    stroke: var(--accent);
    stroke-width: 3;
  }
  .flow {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 0.1 18;
    fill: none;
    pointer-events: none;
    opacity: 0.85;
  }
  .el {
    cursor: grab;
  }
  .glow {
    fill: var(--accent);
    stroke: var(--accent);
    stroke-width: 2;
  }
  .hitbox {
    fill: transparent;
  }
  .el.sel .hitbox {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-dasharray: 3 3;
    rx: 6;
  }
  .sym {
    stroke: var(--ink);
    stroke-width: 2;
    fill: none;
    stroke-linejoin: round;
  }
  .body {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 2;
  }
  .glyph {
    font: 700 13px var(--sans, sans-serif);
    text-anchor: middle;
    fill: var(--ink);
    pointer-events: none;
  }
  .lbl {
    font: 11px var(--mono, monospace);
    fill: var(--muted);
    pointer-events: none;
  }
  .lbl.id {
    fill: var(--ink);
    font-weight: 700;
  }
  .lbl.meter {
    fill: var(--accent);
    font-weight: 700;
  }
  .pm {
    font: 10px var(--mono, monospace);
    fill: var(--muted);
    pointer-events: none;
  }
  .port {
    fill: var(--panel);
    stroke: var(--accent);
    stroke-width: 1.5;
    cursor: crosshair;
  }
  .port.open {
    fill: var(--warn-soft, #fde);
    stroke: var(--warn);
  }
  .port.pend,
  .port:hover {
    fill: var(--accent);
  }
  .box {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-dasharray: 4 3;
    pointer-events: none;
  }
  svg.pan {
    cursor: grab;
  }
  .rubber {
    stroke: var(--accent);
    stroke-width: 2;
    stroke-dasharray: 5 4;
    pointer-events: none;
  }
  .empty,
  .tip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    max-width: 440px;
    text-align: center;
    color: var(--muted);
    font-size: 13px;
    pointer-events: none;
  }
  .empty {
    top: 40%;
  }
  .tip {
    top: 10px;
    background: var(--panel-2);
    padding: 4px 10px;
    border-radius: 6px;
  }
</style>
