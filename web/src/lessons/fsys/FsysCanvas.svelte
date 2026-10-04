<script lang="ts">
  // The generation fleet as one bar (synchronous, grid-following, grid-forming),
  // the system inertia it adds up to, the tripped unit, and a frequency gauge at
  // the cursor with the RoCoF relay and load-shedding thresholds.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { FSYS, type FsysInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as FsysInfo);
  const sm = $derived(1 - lab.params.share);
  const gfm = $derived(lab.params.share * lab.params.gfm);
  const gfl = $derived(lab.params.share - gfm);
  const tripped = $derived(lab.t >= FSYS.tLoss);
  const f = $derived(lab.at('f'));
  // Gauge: 47.5–50.5 Hz over a half circle.
  const ang = (v: number) => Math.PI * (1 - (Math.min(50.5, Math.max(47.5, v)) - 47.5) / 3);
  const gx = (v: number, r: number) => 300 + r * Math.cos(ang(v));
  const gy = (v: number, r: number) => 128 - r * Math.sin(ang(v));
  const BX = 20, BW = 200;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Parc de production et fréquence', en: 'Generation fleet and frequency' })}</span>
    <span class="spacer"></span>
    {#if k.ufls}<span class="warn">{tr({ fr: 'délestage', en: 'load shedding' })}</span>{/if}
    {#if k.rocofTrip}<span class="warn">RoCoF</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="Generation fleet and frequency gauge">
      <!-- fleet bar -->
      <text x={BX} y="30" text-anchor="start" class="lbl">{tr({ fr: 'Production : 30 GW', en: 'Generation: 30 GW' })}</text>
      <rect x={BX} y="38" width={BW * sm} height="26" class="sm" />
      <rect x={BX + BW * sm} y="38" width={BW * gfl} height="26" class="gfl" />
      <rect x={BX + BW * (sm + gfl)} y="38" width={BW * gfm} height="26" class="gfm" />
      <rect x={BX} y="38" width={BW} height="26" class="frame" />
      <g text-anchor="start" class="leg">
        <rect x={BX} y="74" width="9" height="9" class="sm" /><text x={BX + 13} y="82">{tr({ fr: 'machines synchrones', en: 'synchronous machines' })} {num(100 * sm, 2)} %</text>
        <rect x={BX} y="90" width="9" height="9" class="gfl" /><text x={BX + 13} y="98">{tr({ fr: 'onduleurs suiveurs', en: 'grid-following' })} {num(100 * gfl, 2)} %</text>
        <rect x={BX} y="106" width="9" height="9" class="gfm" /><text x={BX + 13} y="114">{tr({ fr: 'onduleurs formeurs', en: 'grid-forming' })} {num(100 * gfm, 2)} %</text>
      </g>
      <text x={BX} y="140" text-anchor="start" class="ro">H<tspan baseline-shift="sub" font-size="7">sys</tspan> = {num(k.H, 3)} s</text>
      {#if lab.params.ffr > 0}<text x={BX} y="156" text-anchor="start" class="ro">FFR = {num(lab.params.ffr, 3)} MW</text>{/if}
      <!-- tripped unit -->
      <g class:gone={tripped}>
        <rect x="150" y="128" width="64" height="30" rx="4" class="unit" />
        <text x="182" y="141" class="lbl">−{FSYS.loss} MW</text>
        <text x="182" y="153" class="lbl">{tripped ? tr({ fr: 'déclenché', en: 'tripped' }) : 't = 1 s'}</text>
      </g>
      {#if tripped}<path d="M156,130 l52,26 M208,130 l-52,26" class="x" />{/if}
      <!-- gauge -->
      <path d="M{gx(47.5, 70)},{gy(47.5, 70)} A70,70 0 0 1 {gx(50.5, 70)},{gy(50.5, 70)}" class="arc" />
      <path d="M{gx(47.5, 70)},{gy(47.5, 70)} A70,70 0 0 1 {gx(FSYS.ufls, 70)},{gy(FSYS.ufls, 70)}" class="arc bad" />
      {#each [48, 49, 50] as v (v)}
        <line x1={gx(v, 62)} y1={gy(v, 62)} x2={gx(v, 74)} y2={gy(v, 74)} class="tick" />
        <text x={gx(v, 86)} y={gy(v, 86) + 3} class="lbl">{v}</text>
      {/each}
      {#if !lab.concealed && isFinite(f)}
        <line x1="300" y1="128" x2={gx(f, 60)} y2={gy(f, 60)} class="needle" class:bad={f < FSYS.ufls} />
        <circle cx="300" cy="128" r="4" class="hub" />
        <text x="300" y="152" class="v" class:bad={f < FSYS.ufls}>{num(f, 4)} Hz</text>
        <text x="300" y="168" class="lbl">nadir {num(k.nadir, 4)} Hz · RoCoF {num(k.rocof, 3)} Hz/s</text>
      {/if}
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
    margin-left: 6px;
  }
  .sm {
    fill: var(--c-S);
  }
  .gfl {
    fill: var(--c-R);
  }
  .gfm {
    fill: var(--c-C);
  }
  .frame {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.2;
  }
  .leg {
    fill: var(--ink);
    font-size: 9.5px;
  }
  .unit {
    fill: var(--panel-2);
    stroke: var(--c-S);
    stroke-width: 1.5;
  }
  .gone {
    opacity: 0.45;
  }
  .x {
    stroke: var(--warn);
    stroke-width: 2.5;
  }
  .arc {
    fill: none;
    stroke: var(--line);
    stroke-width: 6;
  }
  .arc.bad {
    stroke: var(--warn);
    opacity: 0.6;
  }
  .tick {
    stroke: var(--muted);
    stroke-width: 1.4;
  }
  .needle {
    stroke: var(--c-p);
    stroke-width: 2.5;
  }
  .needle.bad {
    stroke: var(--warn);
  }
  .hub {
    fill: var(--ink);
  }
  .lbl {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .ro {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .v {
    fill: var(--ink);
    font-size: 13px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .v.bad {
    fill: var(--warn);
  }
</style>
