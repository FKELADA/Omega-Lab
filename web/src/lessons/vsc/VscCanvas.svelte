<script lang="ts">
  // The cascaded control of a grid-following VSC: outer P/Q loops → current
  // references → current controller → converter → filter → grid, with the PLL
  // closing the loop from the PCC voltage. Live values at the cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { VscInfo } from '../../lib/models/module7';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as VscInfo);
  const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
  const outer = box(10, 30, 70, 46), inner = box(108, 30, 76, 46), conv = box(212, 30, 50, 46), pll = box(108, 128, 76, 40);
  const blocks = $derived([
    { b: outer, name: { fr: 'Boucles P, Q', en: 'P, Q loops' }, bw: `${num(lab.params.fouter, 2)} Hz`, col: '--c-p' },
    { b: inner, name: { fr: 'Régulateur de courant', en: 'Current controller' }, bw: `${num(lab.params.fc, 3)} Hz`, col: '--c-i' },
    { b: conv, name: { fr: 'VSC', en: 'VSC' }, bw: 'MLI', col: '--c-L' },
    { b: pll, name: { fr: 'PLL', en: 'PLL' }, bw: `${num(lab.params.fpll, 3)} Hz`, col: '--c-S' },
  ]);
  const v = (id: string) => (lab.concealed ? '?' : num(lab.at(id), 3));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Commande en cascade (suiveur de réseau)', en: 'Cascaded control (grid-following)' })}</span>
    <span class="spacer"></span>
    {#if k.unstable}<span class="warn">{tr({ fr: 'instable', en: 'unstable' })}</span>
    {:else if k.limited}<span class="warn">{tr({ fr: 'limitation de courant', en: 'current limit' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="VSC control">
      <defs>
        <marker id="vsc-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="ah" /></marker>
      </defs>
      {#each blocks as bl, j (j)}
        <rect x={bl.b.x} y={bl.b.y} width={bl.b.w} height={bl.b.h} rx="6" class="blk" style="stroke: var({bl.col})" />
        <text x={bl.b.cx} y={bl.b.cy - 3} class="bn">{tr(bl.name)}</text>
        <text x={bl.b.cx} y={bl.b.cy + 12} class="bw" style="fill: var({bl.col})">{bl.bw}</text>
      {/each}
      <!-- signal path -->
      <line x1="80" y1="53" x2="106" y2="53" class="sig" marker-end="url(#vsc-arr)" />
      <text x="94" y="46" class="tiny">i*</text>
      <line x1="184" y1="53" x2="210" y2="53" class="sig" marker-end="url(#vsc-arr)" />
      <text x="197" y="46" class="tiny">v*</text>
      <!-- filter and grid -->
      <line x1="262" y1="53" x2="276" y2="53" class="pw" />
      <path d="M276,53 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0" class="ind" />
      <text x="292" y="40" class="tiny">X<tspan baseline-shift="sub" font-size="7">f</tspan></text>
      <line x1="309" y1="53" x2="322" y2="53" class="pw" />
      <line x1="322" y1="38" x2="322" y2="68" class="bus" />
      <text x="322" y="30" class="tiny">PCC</text>
      <line x1="322" y1="53" x2="336" y2="53" class="pw" />
      <path d="M336,53 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0" class="ind" />
      <text x="347" y="40" class="tiny">1/SCR</text>
      <circle cx="380" cy="53" r="12" class="grid" />
      <path d="M373,53 c2,-6 4.5,-6 7,0 s4.5,6 7,0" class="gs" />
      <!-- measurement and PLL -->
      <path d="M322,68 V148 H186" class="meas" marker-end="url(#vsc-arr)" />
      <text x="258" y="142" class="tiny">v<tspan baseline-shift="sub" font-size="7">PCC</tspan></text>
      <path d="M108,148 H45 V78" class="meas" marker-end="url(#vsc-arr)" />
      <path d="M146,128 V78" class="meas" marker-end="url(#vsc-arr)" />
      <text x="72" y="142" class="tiny">θ, v<tspan baseline-shift="sub" font-size="7">d</tspan></text>
      <!-- live readouts -->
      <text x="10" y="192" class="ro" text-anchor="start">P = {v('P')} · Q = {v('Q')} · i<tspan baseline-shift="sub" font-size="7">d</tspan> = {v('id')} / {v('idr')} · f<tspan baseline-shift="sub" font-size="7">PLL</tspan> = {v('fpll')} Hz</text>
      <text x="322" y="96" class="tiny">SCR = {num(lab.params.SCR, 3)}</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
    display: block;
  }
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .blk {
    fill: var(--panel-2);
    stroke-width: 2;
  }
  .bn {
    fill: var(--ink);
    font-size: 9.5px;
    font-weight: 600;
  }
  .bw {
    font-size: 10px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .sig {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .meas {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.3;
    stroke-dasharray: 4 3;
  }
  .ah {
    fill: var(--ink);
  }
  .pw {
    stroke: var(--muted);
    stroke-width: 2.5;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .gs {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .tiny {
    fill: var(--muted);
    font-size: 9px;
  }
  .ro {
    fill: var(--ink);
    font-size: 10px;
    font-family: var(--mono);
  }
</style>
