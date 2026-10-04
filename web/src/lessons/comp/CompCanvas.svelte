<script lang="ts">
  // Source — line (with an optional series capacitor) — load, with a shunt
  // capacitor or reactor at the load bus.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { CompInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as CompInfo);
  const B = $derived(lab.params.B);
  const kser = $derived(lab.params.k);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.V === null}<span class="warn">{tr({ fr: 'effondrement de tension', en: 'voltage collapse' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="Compensated line">
      <circle cx="36" cy="80" r="18" class="src" />
      <path d="M26,80 c3,-9 6,-9 10,0 s6,9 10,0" class="sym" />
      <text x="36" y="118" class="v">1 pu</text>
      <line x1="54" y1="80" x2="110" y2="80" class="w" />
      <rect x="110" y="72" width="80" height="16" rx="3" class="x" />
      <text x="150" y="62" class="lbl">X</text>
      {#if kser > 0.005}
        <line x1="190" y1="80" x2="212" y2="80" class="w" />
        <line x1="212" y1="66" x2="212" y2="94" class="cap" />
        <line x1="222" y1="66" x2="222" y2="94" class="cap" />
        <text x="217" y="58" class="lbl">−j k X ({num(100 * kser, 3)} %)</text>
        <line x1="222" y1="80" x2="300" y2="80" class="w" />
      {:else}
        <line x1="190" y1="80" x2="300" y2="80" class="w" />
      {/if}
      <line x1="300" y1="56" x2="300" y2="104" class="bus" />
      <!-- load -->
      <line x1="300" y1="80" x2="360" y2="80" class="w" />
      <path d="M360,80 v20 m-8,-8 l8,10 l8,-10" class="load" />
      <text x="360" y="128" class="v">P = {num(lab.params.P, 3)}</text>
      <!-- shunt device -->
      {#if Math.abs(B) > 0.005}
        <line x1="300" y1="104" x2="300" y2="140" class="w" />
        {#if B > 0}
          <line x1="286" y1="140" x2="314" y2="140" class="cap" />
          <line x1="286" y1="150" x2="314" y2="150" class="cap" />
        {:else}
          <path d="M300,140 a6,6 0 0 1 0,12 a6,6 0 0 1 0,12 a6,6 0 0 1 0,12" class="ind" />
        {/if}
        <text x="300" y="196" class="lbl">{B > 0 ? tr({ fr: 'condensateur', en: 'capacitor' }) : tr({ fr: 'inductance', en: 'reactor' })} Q = {num(k.Qc, 3)}</text>
      {/if}
      <text x="300" y="44" class="big" class:bad={k.V === null || Math.abs((k.V ?? 0) - 1) > 0.05}>{k.V === null ? '—' : `${num(k.V, 3)} pu`}</text>
      <text x="150" y="210" class="small">P<tspan baseline-shift="sub" font-size="8">max</tspan> = {num(k.Pmax, 3)} pu</text>
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
  .warn {
    color: var(--warn);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
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
  .x {
    fill: var(--panel-2);
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 3;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2.4;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .load {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2.4;
  }
  .lbl {
    fill: var(--muted);
    font-size: 11px;
  }
  .v {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .big {
    fill: var(--ink);
    font-size: 15px;
    font-weight: 700;
    font-family: var(--mono);
  }
  .big.bad {
    fill: var(--warn);
  }
  .small {
    fill: var(--muted);
    font-size: 11px;
    font-family: var(--mono);
  }
</style>
