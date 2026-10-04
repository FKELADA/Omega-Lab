<script lang="ts">
  // The line drawn as the chosen model: series impedance only (short), one π
  // section (nominal π), or a ladder of many small sections (distributed).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { LINE_MODELS, type LineInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LineInfo);
  const Vph = $derived((lab.params.kV * 1e3) / Math.sqrt(3));
  const vr = $derived(cabs(k.chosen.Vr) / Vph);
  const model = $derived(lab.params.model);
  const sections = $derived(model === LINE_MODELS.exact ? 6 : 1);
  const x0 = 80, x1 = 320;
  const seg = $derived((x1 - x0) / sections);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="km">{num(lab.params.km, 3)} km · {lab.params.kV} kV</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="Line model">
      <!-- sending source -->
      <circle cx="40" cy="90" r="18" class="src" />
      <path d="M30,90 c3,-9 6,-9 10,0 s6,9 10,0" class="sym" />
      <text x="40" y="128" class="v">1,00 pu</text>
      <line x1="58" y1="90" x2={x0} y2="90" class="w" />
      <line x1="40" y1="108" x2="40" y2="170" class="w" />
      <line x1="40" y1="170" x2="370" y2="170" class="w" />

      {#each Array(sections) as _, j (j)}
        {@const a = x0 + j * seg}
        <rect x={a + seg * 0.18} y="82" width={seg * 0.64} height="16" rx="3" class="z" />
        <line x1={a} y1="90" x2={a + seg * 0.18} y2="90" class="w" />
        <line x1={a + seg * 0.82} y1="90" x2={a + seg} y2="90" class="w" />
        {#if model !== LINE_MODELS.short}
          {#each model === LINE_MODELS.pi ? [a + 4, a + seg - 4] : [a + seg] as cxp, m (m)}
            <line x1={cxp} y1="90" x2={cxp} y2="122" class="w" />
            <line x1={cxp - 9} y1="122" x2={cxp + 9} y2="122" class="cap" />
            <line x1={cxp - 9} y1="129" x2={cxp + 9} y2="129" class="cap" />
            <line x1={cxp} y1="129" x2={cxp} y2="170" class="w" />
          {/each}
        {/if}
      {/each}
      {#if model === LINE_MODELS.short}<text x="200" y="74" class="lbl">R + jX</text>{/if}
      {#if model === LINE_MODELS.pi}<text x="200" y="74" class="lbl">Z = (r + jωl)·L, Y/2 {tr({ fr: 'à chaque bout', en: 'at each end' })}</text>{/if}
      {#if model === LINE_MODELS.exact}<text x="200" y="74" class="lbl">{tr({ fr: 'paramètres répartis (ici 6 tronçons)', en: 'distributed parameters (6 sections shown)' })}</text>{/if}

      <!-- load -->
      <line x1={x1} y1="90" x2="370" y2="90" class="w" />
      <rect x="360" y="104" width="20" height="40" rx="3" class="load" />
      <line x1="370" y1="90" x2="370" y2="104" class="w" />
      <line x1="370" y1="144" x2="370" y2="170" class="w" />
      <text x="370" y="62" class="v" class:bad={Math.abs(vr - 1) > 0.05}>{lab.concealed ? '?' : `${num(vr, 3)} pu`}</text>
      <text x="370" y="196" class="small">{lab.params.P > 0 ? si(lab.params.P * 1e6, 'W') : tr({ fr: 'à vide', en: 'no load' })}</text>
      <text x="200" y="210" class="small">SIL = {si(k.SIL, 'W')} · Z<tspan baseline-shift="sub" font-size="8">c</tspan> = {num(k.Zc.re, 3)} Ω</text>
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
  text {
    text-anchor: middle;
  }
  .km {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
  }
  .src {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2.4;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .z {
    fill: var(--panel-2);
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .load {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .lbl {
    fill: var(--muted);
    font-size: 11px;
  }
  .v {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 600;
  }
  .v.bad {
    fill: var(--warn);
  }
  .small {
    fill: var(--muted);
    font-size: 11px;
    font-family: var(--mono);
  }
</style>
