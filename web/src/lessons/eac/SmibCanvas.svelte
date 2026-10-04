<script lang="ts">
  // A generator on an infinite bus through two parallel lines. At t = 0.1 s a
  // fault hits one line; its breakers open at the clearing time. The rotor
  // angle is drawn as a dial.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FAULT_AT, SMIB, type SmibInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as SmibInfo);
  const tc = $derived(lab.params.tc / 1000);
  const faulted = $derived(lab.t >= SMIB.tFault && lab.t < SMIB.tFault + tc);
  const cleared = $derived(lab.t >= SMIB.tFault + tc);
  const delta = $derived(lab.at('delta'));
  const fx = $derived(lab.params.loc === FAULT_AT.bus ? 132 : 220);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Machine sur réseau infini', en: 'Machine on an infinite bus' })}</span>
    <span class="spacer"></span>
    {#if !k.stable}<span class="warn">{tr({ fr: 'perte de synchronisme', en: 'loss of synchronism' })}</span>
    {:else if faulted}<span class="warn">{tr({ fr: 'défaut', en: 'fault' })}</span>
    {:else if cleared}<span class="ok">{tr({ fr: 'défaut éliminé', en: 'fault cleared' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="Single machine, infinite bus">
      <!-- rotor-angle dial -->
      <circle cx="54" cy="96" r="34" class="dial" />
      {#if isFinite(delta) && !lab.concealed}
        <line x1="54" y1="96" x2={54 + 30 * Math.cos(-delta * Math.PI / 180)} y2={96 + 30 * Math.sin(-delta * Math.PI / 180)} class="rotor" />
        <line x1="54" y1="96" x2="88" y2="96" class="ref" />
        <text x="54" y="148" class="v">δ = {num(delta, 3)}°</text>
      {/if}
      <text x="54" y="52" class="lbl">H = {num(lab.params.H, 2)} s</text>
      <line x1="88" y1="96" x2="132" y2="96" class="w" />
      <line x1="132" y1="66" x2="132" y2="126" class="bus" />
      <!-- two lines -->
      <line x1="132" y1="76" x2="310" y2="76" class="w" />
      <line x1="132" y1="116" x2="310" y2="116" class="w" class:dead={cleared} />
      {#if cleared}
        <path d="M146,110 l10,12 M156,110 l-10,12 M286,110 l10,12 M296,110 l-10,12" class="brk" />
      {/if}
      <line x1="310" y1="66" x2="310" y2="126" class="bus" />
      <line x1="310" y1="96" x2="344" y2="96" class="w" />
      <circle cx="362" cy="96" r="18" class="grid" />
      <text x="362" y="100" class="inf">∞</text>
      <!-- fault -->
      <path d="M{fx + 4},{116 + 4} l-8,12 h7 l-8,14" class="bolt" class:on={faulted} />
      <text x={fx} y="162" class="lbl">{lab.params.loc === FAULT_AT.bus ? tr({ fr: 'défaut au poste', en: 'fault at the bus' }) : tr({ fr: 'défaut en ligne', en: 'fault on the line' })}</text>
      <text x="220" y="196" class="lbl">P<tspan baseline-shift="sub" font-size="7">m</tspan> = {num(lab.params.Pm, 3)} · t<tspan baseline-shift="sub" font-size="7">c</tspan> = {num(lab.params.tc, 3)} ms · CCT = {k.cct === null ? '—' : `${num(k.cct, 3)} ms`}</text>
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
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .ok {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .dial {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2.2;
  }
  .rotor {
    stroke: var(--c-p);
    stroke-width: 3;
  }
  .ref {
    stroke: var(--muted);
    stroke-dasharray: 3 3;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.dead {
    stroke: var(--line);
    stroke-dasharray: 4 4;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .brk {
    stroke: var(--warn);
    stroke-width: 2.2;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .inf {
    fill: var(--c-S);
    font-size: 16px;
  }
  .bolt {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2.2;
  }
  .bolt.on {
    stroke: var(--warn);
    stroke-width: 3;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--c-p);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
</style>
