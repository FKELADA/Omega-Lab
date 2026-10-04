<script lang="ts">
  // Radial supply: generator → two lines (one trips at 10 s) → HV bus → on-load
  // tap changer → LV bus and its load (with thermostats if recovering).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { LTVS, OLTC_MODES, type LtvsInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LtvsInfo);
  const tripped = $derived(lab.t >= LTVS.tTrip);
  const V1 = $derived(lab.at('V1')), V2 = $derived(lab.at('V2')), tap = $derived(lab.at('tap'));
  const blocked = $derived(lab.params.oltc === OLTC_MODES.off || (lab.params.oltc === OLTC_MODES.block && isFinite(V1) && V1 < 0.9));
  const gone = $derived(!isFinite(V1));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Alimentation d’une région', en: 'Supplying a region' })}</span>
    <span class="spacer"></span>
    {#if gone}<span class="warn">{tr({ fr: 'effondrement', en: 'collapse' })}</span>
    {:else if k.unstable}<span class="warn">{tr({ fr: 'tension HT dégradée', en: 'HV voltage degraded' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="Radial supply with tap changer">
      <circle cx="30" cy="90" r="16" class="gen" />
      <path d="M21,90 c3,-7 6,-7 9,0 s6,7 9,0" class="sym" />
      <text x="30" y="124" class="lbl">E = {LTVS.E}</text>
      <line x1="46" y1="90" x2="66" y2="90" class="w" />
      <line x1="66" y1="66" x2="66" y2="114" class="bus" />
      <line x1="66" y1="74" x2="170" y2="74" class="w" />
      <line x1="66" y1="106" x2="170" y2="106" class="w" class:dead={tripped} />
      {#if tripped}<path d="M112,100 l12,12 M124,100 l-12,12" class="x" />{/if}
      <text x="118" y="64" class="lbl">{tr({ fr: '2 lignes', en: '2 lines' })}</text>
      <line x1="170" y1="66" x2="170" y2="114" class="bus" />
      {#if !lab.concealed}<text x="170" y="56" class="v" class:bad={isFinite(V1) && V1 < 0.9}>{gone ? '—' : num(V1, 3)}</text>{/if}
      <text x="170" y="132" class="lbl">HT</text>
      {#if lab.params.B > 0.005}
        <line x1="170" y1="114" x2="170" y2="150" class="w" />
        <line x1="158" y1="150" x2="182" y2="150" class="cap" /><line x1="158" y1="157" x2="182" y2="157" class="cap" />
      {/if}
      <!-- OLTC transformer -->
      <line x1="170" y1="90" x2="200" y2="90" class="w" />
      <circle cx="214" cy="90" r="13" class="tr" /><circle cx="232" cy="90" r="13" class="tr" />
      <path d="M210,110 l26,-40 m-6,0 h6 v6" class="oltc" class:off={blocked} />
      {#if !lab.concealed}<text x="223" y="128" class="ro">n = {num(tap, 3)}</text>{/if}
      <text x="223" y="142" class="lbl">{blocked ? tr({ fr: 'régleur bloqué', en: 'tap changer blocked' }) : tr({ fr: 'régleur actif', en: 'tap changer active' })}</text>
      <line x1="245" y1="90" x2="290" y2="90" class="w" />
      <line x1="290" y1="66" x2="290" y2="114" class="bus" />
      {#if !lab.concealed}<text x="290" y="56" class="v" class:bad={isFinite(V2) && V2 < 0.95}>{gone ? '—' : num(V2, 3)}</text>{/if}
      <text x="290" y="132" class="lbl">BT</text>
      <!-- load -->
      <line x1="290" y1="90" x2="340" y2="90" class="w" />
      <path d="M326,74 l14,-12 l14,12 v20 h-28 z" class="house" />
      {#if lab.params.rec > 0.05}<text x="340" y="88" class="th">🌡</text>{/if}
      {#if !lab.concealed}<text x="340" y="112" class="ro">P = {gone ? '—' : num(lab.at('P'), 3)}</text>{/if}
      <text x="340" y="126" class="lbl">P₀ = {num(lab.params.P0, 3)}</text>
      <text x="200" y="190" class="lbl">{tr({ fr: 'ligne déclenchée à t = 10 s', en: 'line trips at t = 10 s' })}{k.tCollapse !== null ? ` · ${tr({ fr: 'effondrement à', en: 'collapse at' })} ${num(k.tCollapse, 3)} s` : ''}</text>
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
  .gen {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.dead {
    stroke: var(--line);
    stroke-dasharray: 4 4;
  }
  .x {
    stroke: var(--warn);
    stroke-width: 2.5;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .tr {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 1.8;
  }
  .oltc {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 1.6;
  }
  .oltc.off {
    stroke: var(--line);
  }
  .house {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 1.8;
  }
  .th {
    font-size: 11px;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .v.bad {
    fill: var(--warn);
  }
  .ro {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
</style>
