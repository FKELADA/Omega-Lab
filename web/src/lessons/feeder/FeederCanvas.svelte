<script lang="ts">
  // A 20 kV feeder at the hour under the cursor: substation with tap changer,
  // five nodes each with homes and a PV plant, voltage bars against the limits,
  // and the direction of power flow on each section.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FEEDER, feederFlow, feederLoad, pvShape } from '../../lib/models/module5';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const h = $derived(lab.t);
  const st = $derived(feederFlow(lab.params, (lab.params.pv / 10) * pvShape(h), feederLoad(h)));
  const xs = [64, 127, 190, 253, 316, 379];
  const busY = 80;
  /** Voltage bar: 1.0 pu at the bus line, ±0.1 pu = ±40 px. */
  const barY = (V: number) => 150 - (V - 1) * 400;
  const hh = $derived(`${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}`);
  const sun = $derived(pvShape(h));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Départ 20 kV', en: '20 kV feeder' })} · {hh}</span>
    <span class="spacer"></span>
    {#if st.Psub < 0}<span class="warn">{tr({ fr: 'flux inverse vers le poste', en: 'reverse flow to the substation' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" text-anchor="middle" role="img" aria-label="Distribution feeder">
      <!-- substation transformer -->
      <circle cx={xs[0]} cy={busY - 40} r="11" class="tr" />
      <circle cx={xs[0]} cy={busY - 26} r="11" class="tr" />
      <path d="M{xs[0] + 12},{busY - 46} l-24,24 m20,-24 h4 v4" class="oltc" />
      <line x1={xs[0]} y1={busY - 15} x2={xs[0]} y2={busY} class="w" />
      <text x={xs[0] + 18} y={busY - 52} class="small" text-anchor="start">{tr({ fr: 'poste', en: 'substation' })}</text>

      <!-- sections with flow direction -->
      {#each xs.slice(0, -1) as x, j (j)}
        {@const f = st.flows[j]}
        <line x1={x} y1={busY} x2={xs[j + 1]} y2={busY} class="sec" class:rev={f < 0} style="stroke-width: {1.5 + Math.min(5, Math.abs(f) / 1.5)}" />
        {#if Math.abs(f) > 0.05 && !lab.concealed}
          {@const m = (x + xs[j + 1]) / 2}
          <path d={f > 0 ? `M${m - 5},${busY - 6} l8,6 l-8,6` : `M${m + 5},${busY - 6} l-8,6 l8,6`} class="arrow" class:rev={f < 0} />
          <text x={m} y={busY - 10} class="flow" class:rev={f < 0}>{num(Math.abs(f), 2)}</text>
        {/if}
      {/each}

      <!-- nodes: homes and PV -->
      {#each xs as x, j (j)}
        <line x1={x} y1={busY - 8} x2={x} y2={busY + 8} class="bus" />
        {#if j > 0}
          <path d="M{x - 18},{busY - 26} l7,-7 l7,7 v9 h-14 z" class="home" />
          <rect x={x + 3} y={busY - 32} width="15" height="10" rx="1.5" class="pv" style="fill-opacity: {0.15 + 0.8 * sun}" />
        {/if}
      {/each}

      <!-- voltage bars against the limits -->
      <rect x="44" y={barY(1.05)} width="350" height={barY(0.95) - barY(1.05)} class="band" />
      <line x1="44" y1={barY(1)} x2="394" y2={barY(1)} class="ref" />
      <line x1="44" y1={barY(FEEDER.Vmax)} x2="394" y2={barY(FEEDER.Vmax)} class="lim" />
      <line x1="44" y1={barY(0.95)} x2="394" y2={barY(0.95)} class="lim" />
      <text x="40" y={barY(FEEDER.Vmax) + 3} class="small" text-anchor="end">1,05</text>
      <text x="40" y={barY(1) + 3} class="small" text-anchor="end">1,00</text>
      <text x="40" y={barY(0.95) + 3} class="small" text-anchor="end">0,95</text>
      {#if !lab.concealed}
        {#each st.V as V, j (j)}
          {@const bad = V > FEEDER.Vmax + 1e-4 || V < 0.95}
          <rect x={xs[j] - 7} y={Math.min(barY(V), barY(1))} width="14" height={Math.max(1, Math.abs(barY(V) - barY(1)))} class="vbar" class:bad />
          <text x={xs[j]} y={barY(V) + (V >= 1 ? -5 : 12)} class="v" class:bad>{num(V, 3)}</text>
        {/each}
      {/if}
      <text x="200" y="222" class="small">
        {tr({ fr: 'PV', en: 'PV' })} {num(st.Ppv, 3)} MW · {tr({ fr: 'poste', en: 'substation' })} {num(st.Psub, 3)} MW{st.curtailed > 0.01 ? ` · ${tr({ fr: 'écrêté', en: 'curtailed' })} ${num(st.curtailed, 2)} MW` : ''}
      </text>
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
  .tr {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 1.8;
  }
  .oltc {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 1.5;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .sec {
    stroke: var(--c-C);
  }
  .sec.rev,
  .arrow.rev {
    stroke: var(--warn);
  }
  .arrow {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2;
  }
  .flow {
    fill: var(--c-p);
    font-size: 9.5px;
    font-family: var(--mono);
  }
  .flow.rev {
    fill: var(--warn);
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .home {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 1.5;
  }
  .pv {
    fill: var(--c-i);
    stroke: var(--c-i);
    stroke-width: 1.2;
  }
  .band {
    fill: var(--good-soft);
  }
  .ref {
    stroke: var(--muted);
    stroke-dasharray: 3 3;
  }
  .lim {
    stroke: var(--warn);
    stroke-width: 1;
    stroke-dasharray: 5 3;
  }
  .vbar {
    fill: var(--c-S);
  }
  .vbar.bad {
    fill: var(--warn);
  }
  .v {
    fill: var(--ink);
    font-size: 9.5px;
    font-family: var(--mono);
  }
  .v.bad {
    fill: var(--warn);
    font-weight: 700;
  }
  .small {
    fill: var(--muted);
    font-size: 9.5px;
  }
</style>
