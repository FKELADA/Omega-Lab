<script lang="ts">
  // An analogue frequency meter, 48 to 50.5 Hz, with the operating bands.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { SYS, type BlackoutInfo } from '../../lib/models/module0';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as BlackoutInfo);
  const f = $derived(lab.at('f'));
  const lo = 48, hi = 50.5;
  const cx = 200, cy = 150, R = 110;
  // −150° … −30° sweep (SVG angles measured from +x, y down).
  const ang = (v: number) => (Math.PI * (210 + (120 * (Math.min(hi, Math.max(lo, v)) - lo)) / (hi - lo))) / 180;
  const P = (v: number, r = R): [number, number] => [cx + r * Math.cos(ang(v)), cy + r * Math.sin(ang(v))];
  const arc = (a: number, b: number, r = R) => {
    const [x1, y1] = P(a, r), [x2, y2] = P(b, r);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const needle = $derived(P(f, R - 12));
  const bands = [
    { a: 49.8, b: 50.2, cls: 'ok' },
    { a: 49.5, b: 49.8, cls: 'warn1' },
    { a: SYS.lfdd, b: 49.5, cls: 'warn2' },
    { a: lo, b: SYS.lfdd, cls: 'bad' },
  ];
  const ticks = [48, 48.5, 49, 49.5, 50, 50.5];
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Fréquence du réseau', en: 'Grid frequency' })}</span>
    <span class="spacer"></span>
    {#if lab.at('shed') > 0}<span class="warn">{tr({ fr: 'délestage', en: 'load shedding' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="Frequency meter">
      {#each bands as b (b.cls)}
        <path d={arc(b.a, b.b)} class="band {b.cls}" />
      {/each}
      {#each ticks as t (t)}
        {@const [x1, y1] = P(t, R + 6)}
        {@const [x2, y2] = P(t, R + 16)}
        <line {x1} {y1} {x2} {y2} class="tick" />
        <text x={P(t, R + 28)[0]} y={P(t, R + 28)[1] + 4} class="tl">{num(t, 3)}</text>
      {/each}
      <line x1={cx} y1={cy} x2={needle[0]} y2={needle[1]} class="needle" />
      <circle {cx} {cy} r="6" class="hub" />
      {#if isFinite(k.nadir)}
        {@const m = P(k.nadir, R - 4)}
        <circle cx={m[0]} cy={m[1]} r="4" class="nadir" />
      {/if}
      <text x={cx} y={cy + 34} class="big">{num(f, 4)} Hz</text>
      <text x={cx} y={cy + 54} class="small">RoCoF {si(lab.at('rocof'), 'Hz/s')} · {tr({ fr: 'perdu', en: 'lost' })} {si(lab.at('lost') * 1e6, 'W')}</text>
      <text x="16" y="208" class="legend ok-t" text-anchor="start">49,8–50,2 {tr({ fr: 'normal', en: 'normal' })}</text>
      <text x="384" y="208" class="legend bad-t" text-anchor="end">&lt; 48,8 {tr({ fr: 'délestage', en: 'load shedding' })}</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .warn {
    color: var(--warn);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .band {
    fill: none;
    stroke-width: 14;
  }
  .ok {
    stroke: var(--good);
  }
  .warn1 {
    stroke: color-mix(in srgb, var(--good) 40%, var(--warn));
  }
  .warn2 {
    stroke: var(--warn);
  }
  .bad {
    stroke: #c0392b;
  }
  .tick {
    stroke: var(--muted);
  }
  .tl {
    fill: var(--muted);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .needle {
    stroke: var(--ink);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .hub {
    fill: var(--ink);
  }
  .nadir {
    fill: var(--accent);
  }
  .big {
    fill: var(--ink);
    font-size: 20px;
    font-weight: 700;
    font-family: var(--mono);
  }
  .small {
    fill: var(--muted);
    font-size: 11px;
    font-family: var(--mono);
  }
  .legend {
    font-size: 10.5px;
  }
  .ok-t {
    fill: var(--good);
  }
  .bad-t {
    fill: #c0392b;
  }
</style>
