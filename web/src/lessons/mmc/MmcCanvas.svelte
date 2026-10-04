<script lang="ts">
  // One MMC phase leg at the cursor: N sub-modules per arm, the inserted ones lit
  // (nearest-level modulation), arm inductors, the AC output between the arms.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { MMC, type MmcInfo } from '../../lib/models/module7c';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as MmcInfo);
  const N = $derived(Math.round(lab.params.N));
  const ref = $derived(lab.at('vref'));
  const nu = $derived(Math.max(0, Math.min(N, Math.round((N / 2) * (1 - ref / (MMC.Vdc / 2))))));
  const nl = $derived(N - nu);
  const h = $derived(Math.min(10, 74 / N));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Bras de convertisseur modulaire multiniveau', en: 'Modular multilevel converter leg' })}</span>
    <span class="spacer"></span>
    <span class="lv">{k.levels} {tr({ fr: 'niveaux', en: 'levels' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="MMC phase leg">
      <!-- DC poles -->
      <line x1="60" y1="10" x2="200" y2="10" class="pole" />
      <line x1="60" y1="200" x2="200" y2="200" class="pole" />
      <text x="40" y="14" class="lbl">+{MMC.Vdc / 2} kV</text>
      <text x="40" y="204" class="lbl">−{MMC.Vdc / 2} kV</text>
      <!-- upper arm -->
      {#each Array.from({ length: N }, (_, j) => j) as j (j)}
        <rect x="120" y={14 + j * h} width="40" height={h - 1.5} rx="1.5" class="sm" class:on={j < nu} />
      {/each}
      <path d="M140,{16 + N * h} v3 c8,2 8,6 0,8 c8,2 8,6 0,8 v3" class="ind" />
      <!-- AC node -->
      <line x1="140" y1="105" x2="250" y2="105" class="w" />
      <circle cx="140" cy="105" r="3" class="dot" />
      <!-- lower arm -->
      <path d="M140,{108} v3 c8,2 8,6 0,8 c8,2 8,6 0,8 v3" class="ind" />
      {#each Array.from({ length: N }, (_, j) => j) as j (j)}
        <rect x="120" y={196 - (N - j) * h} width="40" height={h - 1.5} rx="1.5" class="sm" class:on={j < nl} />
      {/each}
      <text x="96" y="58" class="arm">{tr({ fr: 'bras haut', en: 'upper arm' })}</text>
      <text x="96" y="70" class="cnt">{nu}/{N}</text>
      <text x="96" y="150" class="arm">{tr({ fr: 'bras bas', en: 'lower arm' })}</text>
      <text x="96" y="162" class="cnt">{nl}/{N}</text>
      <!-- AC side -->
      <circle cx="268" cy="105" r="16" class="grid" />
      <path d="M259,105 c3,-7 6,-7 9,0 s6,7 9,0" class="gs" />
      {#if !lab.concealed}
        <text x="292" y="60" class="ro" text-anchor="start">v<tspan baseline-shift="sub" font-size="7">ac</tspan> = {num(lab.at('vac'), 3)} kV</text>
        <text x="292" y="76" class="ro" text-anchor="start">V<tspan baseline-shift="sub" font-size="7">SM</tspan> ≈ {num(k.Vc0, 3)} kV</text>
        <text x="292" y="140" class="ro" text-anchor="start">{tr({ fr: 'ondulation', en: 'ripple' })} {num(k.ripple, 3)} %</text>
        <text x="292" y="156" class="ro" text-anchor="start" class:bad={k.spread > 5}>{tr({ fr: 'dispersion', en: 'spread' })} {num(k.spread, 3)} %</text>
      {/if}
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
  .lv {
    color: var(--c-p);
    font-weight: 700;
    text-transform: none;
  }
  .pole {
    stroke: var(--ink);
    stroke-width: 3;
  }
  .sm {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1;
  }
  .sm.on {
    fill: var(--c-C);
    stroke: var(--c-C);
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 1.8;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .dot {
    fill: var(--ink);
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .gs {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.5;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .arm {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .cnt {
    fill: var(--c-C);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .ro {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .ro.bad {
    fill: var(--warn);
    font-weight: 700;
  }
</style>
