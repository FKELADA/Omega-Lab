<script lang="ts">
  // A bus fed through the grid's Thevenin reactance, with an SVC and a STATCOM
  // compared side by side (each in its own copy of the system).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FACTS } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const inDip = $derived(lab.t >= FACTS.tDip && lab.t < FACTS.tClear);
  const rows = $derived([
    { id: 'svc', name: 'SVC', v: lab.at('vSvc'), q: lab.at('qSvc'), color: '--c-C' },
    { id: 'stat', name: 'STATCOM', v: lab.at('vStat'), q: lab.at('qStat'), color: '--c-p' },
  ]);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if inDip}<span class="warn">{tr({ fr: 'creux de tension réseau', en: 'grid voltage dip' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 220" role="img" aria-label="SVC and STATCOM">
      {#each rows as r, j (r.id)}
        {@const y = 60 + j * 100}
        <circle cx="36" cy={y} r="18" class="src" class:dip={inDip} />
        <path d="M26,{y} c3,-9 6,-9 10,0 s6,9 10,0" class="sym" />
        <line x1="54" y1={y} x2="90" y2={y} class="w" />
        <rect x="90" y={y - 8} width="60" height="16" rx="3" class="x" />
        <text x="120" y={y - 14} class="lbl">X = 1/SCR</text>
        <line x1="150" y1={y} x2="220" y2={y} class="w" />
        <line x1="220" y1={y - 22} x2="220" y2={y + 22} class="bus" />
        <line x1="220" y1={y} x2="260" y2={y} class="w" />
        {#if r.id === 'svc'}
          <!-- thyristor-controlled reactor + capacitor -->
          <rect x="260" y={y - 18} width="44" height="36" rx="4" class="dev" style="stroke: var({r.color})" />
          <path d="M268,{y + 6} l8,-12 l8,12 z M268,{y - 6} h16" class="th" style="stroke: var({r.color})" />
          <line x1="290" y1={y - 8} x2="300" y2={y - 8} class="th" style="stroke: var({r.color})" />
          <line x1="290" y1={y + 2} x2="300" y2={y + 2} class="th" style="stroke: var({r.color})" />
        {:else}
          <!-- voltage-source converter -->
          <rect x="260" y={y - 18} width="44" height="36" rx="4" class="dev" style="stroke: var({r.color})" />
          <text x="282" y={y + 5} class="vsc" style="fill: var({r.color})">=/~</text>
        {/if}
        <text x="282" y={y + 34} class="name" style="fill: var({r.color})">{r.name}</text>
        <text x="350" y={y - 4} class="v">V = {num(r.v, 3)}</text>
        <text x="350" y={y + 14} class="v">Q = {num(r.q, 3)}</text>
      {/each}
      <text x="36" y="210" class="small">E = {num(lab.at('vNone'), 3)} pu</text>
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
  .src.dip {
    stroke: var(--warn);
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
  .bus {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .dev {
    fill: var(--panel-2);
    stroke-width: 2.2;
  }
  .th {
    fill: none;
    stroke-width: 2;
  }
  .vsc {
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .name {
    font-size: 11px;
    font-weight: 700;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10.5px;
  }
  .v {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .small {
    fill: var(--muted);
    font-size: 11px;
    font-family: var(--mono);
  }
</style>
