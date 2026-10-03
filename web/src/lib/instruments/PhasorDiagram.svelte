<script lang="ts">
  // Phasors on the complex plane, rotating at ω with the time cursor. The shadow of
  // each arrow on the real axis is its instantaneous value — the bridge between the
  // phasor picture and the oscilloscope.
  import { cadd, cmul, polar, type Complex } from '../core/linalg';
  import type { Lab } from '../lab/lab.svelte';
  import type { PhasorItem } from '../lab/types';
  import { S, tr } from '../ui/ui.svelte';
  import { si } from '../ui/format';
  import { renderMath } from '../ui/markdown';

  /** "V_1+V_2" → text runs with single-character subscripts, for SVG text. */
  const runs = (label: string) =>
    label.split(/(_\w)/).filter(Boolean).map((r) => (r.startsWith('_') ? { t: r[1], sub: true } : { t: r, sub: false }));

  let { lab }: { lab: Lab } = $props();

  const W = 280, H = 260;
  let rotate = $state(true);
  let chain = $state(true);

  const spec = $derived(lab.exp.phasors!);
  const items = $derived(spec.items(lab.params, lab.info));
  const spin = $derived(rotate ? polar(1, spec.omega(lab.params) * lab.t) : polar(1, 0));

  /** Tail and head of every arrow, after rotation. */
  const arrows = $derived.by(() => {
    const out = new Map<string, { it: PhasorItem; tail: Complex; head: Complex }>();
    for (const it of items) {
      const v = cmul({ re: it.value.re * (it.drawScale ?? 1), im: it.value.im * (it.drawScale ?? 1) }, spin);
      const tail = it.tail
        ? cmul(it.tail, spin)
        : chain && it.after
          ? (out.get(it.after)?.head ?? { re: 0, im: 0 })
          : { re: 0, im: 0 };
      out.set(it.id, { it, tail, head: cadd(tail, v) });
    }
    return [...out.values()];
  });

  const scale = $derived.by(() => {
    const ext = Math.max(1e-12, ...arrows.flatMap((a) => [a.head, a.tail]).map((z) => Math.hypot(z.re, z.im)));
    return (0.44 * Math.min(W, H)) / ext;
  });
  const X = (z: Complex) => W / 2 + z.re * scale;
  const Y = (z: Complex) => H / 2 - z.im * scale;

  function head(a: { tail: Complex; head: Complex }) {
    const dx = X(a.head) - X(a.tail), dy = Y(a.head) - Y(a.tail);
    const len = Math.hypot(dx, dy);
    if (len < 6) return '';
    const ux = dx / len, uy = dy / len, s = 9;
    const bx = X(a.head) - ux * s, by = Y(a.head) - uy * s;
    return `M${X(a.head)},${Y(a.head)} L${bx - uy * s * 0.45},${by + ux * s * 0.45} L${bx + uy * s * 0.45},${by - ux * s * 0.45} Z`;
  }
</script>

<section class="panel">
  <header>
    <span>{tr(S.phasors)}</span>
    <span class="spacer"></span>
    <label><input type="checkbox" bind:checked={rotate} /> {tr(S.rotate)}</label>
    <label><input type="checkbox" bind:checked={chain} /> {tr(S.headToTail)}</label>
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label={tr(S.phasors)}>
      <line x1="8" x2={W - 8} y1={H / 2} y2={H / 2} class="axis" />
      <line x1={W / 2} x2={W / 2} y1="8" y2={H - 8} class="axis" />
      <text x={W - 10} y={H / 2 - 6} class="lbl" text-anchor="end">Re</text>
      <text x={W / 2 + 6} y="18" class="lbl">Im</text>

      {#each arrows as a (a.it.id)}
        {#if (!chain || !a.it.after) && !a.it.tail}
          <!-- shadow on the real axis = instantaneous value -->
          <line x1={X(a.head)} y1={Y(a.head)} x2={X(a.head)} y2={H / 2} class="drop" style="stroke: var({a.it.color})" />
          <circle cx={X(a.head)} cy={H / 2} r="3.5" style="fill: var({a.it.color})" />
        {/if}
      {/each}

      {#each arrows as a (a.it.id)}
        <g
          data-term={a.it.term}
          style="color: var({a.it.color})"
          role="presentation"
          onmouseenter={() => (lab.hover = a.it.term)}
          onmouseleave={() => (lab.hover = null)}
        >
          <line
            x1={X(a.tail)}
            y1={Y(a.tail)}
            x2={X(a.head)}
            y2={Y(a.head)}
            class="shaft"
            class:thin={a.it.thin}
          />
          <path d={head(a)} class="tip" />
          <text
            x={X(a.head) + (a.it.thin ? -8 : 6)}
            y={Y(a.head) + (a.it.thin ? 16 : -6)}
            text-anchor={a.it.thin ? 'end' : 'start'}
            class="name"
            >{#each runs(a.it.label) as r, j (j)}{#if r.sub}<tspan baseline-shift="sub" font-size="9">{r.t}</tspan
                >{:else}<tspan>{r.t}</tspan>{/if}{/each}</text
          >
        </g>
      {/each}
    </svg>
    <div class="readout">
      {#each items as it (it.id)}
        <span style="color: var({it.color})"
          >{@html renderMath(it.label)} = {si(Math.hypot(it.value.re, it.value.im), it.unit ?? spec.unit)} ∠ {Math.round(
            (Math.atan2(it.value.im, it.value.re) * 180) / Math.PI,
          )}°</span
        >
      {/each}
    </div>
  </div>
</section>

<style>
  .body {
    display: flex;
    flex-direction: column;
  }
  svg {
    width: 100%;
    flex: 1;
    min-height: 160px;
    display: block;
  }
  header {
    flex-wrap: nowrap;
  }
  header label {
    white-space: nowrap;
    display: inline-flex;
    gap: 4px;
    align-items: center;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .axis {
    stroke: var(--faint);
  }
  .lbl {
    fill: var(--muted);
    font-size: 12px;
    font-style: italic;
  }
  .drop {
    stroke-width: 1;
    stroke-dasharray: 2 3;
    opacity: 0.7;
  }
  .shaft {
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
  }
  .shaft.thin {
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }
  .tip {
    fill: currentColor;
  }
  .name {
    fill: currentColor;
    font-size: 14px;
    font-weight: 600;
  }
  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-family: var(--mono);
    font-size: 11.5px;
  }
</style>
