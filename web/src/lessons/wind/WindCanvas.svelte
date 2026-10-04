<script lang="ts">
  // A wind turbine at the cursor: the rotor turns at the simulated speed, the
  // blades widen with pitch, and the converter feeds the grid.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { windPoint, WT, type WindInfo } from '../../lib/models/module7b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as WindInfo);
  const pt = $derived(windPoint(lab.params, lab.t));
  // Rotor angle: integrate the speed up to the cursor.
  const angle = $derived.by(() => {
    const { t, s } = lab.run;
    let a = 0;
    for (let j = 1; j <= lab.idx; j++) a += ((s.rpm[j] + s.rpm[j - 1]) / 2) * 6 * (t[j] - t[j - 1]);
    return a;
  });
  const event = $derived(lab.t >= WT.tFreq);
  const cx = 120, cy = 70;
  const blade = (deg: number) => `rotate(${deg} ${cx} ${cy})`;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Éolienne 2 MW (type 4, convertisseur complet)', en: '2 MW wind turbine (type 4, full converter)' })}</span>
    <span class="spacer"></span>
    {#if pt.beta > 0.5}<span class="pitch">{tr({ fr: 'calage actif', en: 'pitching' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="Wind turbine">
      <!-- wind arrows -->
      {#each [40, 70, 100] as y (y)}
        <path d="M14,{y} h{12 + pt.v * 2.2} m-6,-4 l6,4 l-6,4" class="wind" />
      {/each}
      <text x="40" y="128" class="lbl">{num(pt.v, 3)} m/s</text>
      <!-- tower and nacelle -->
      <path d="M114,{cy + 6} L106,200 H134 L126,{cy + 6} Z" class="tower" />
      <rect x={cx - 4} y={cy - 8} width="34" height="16" rx="5" class="nacelle" />
      <!-- rotor -->
      {#each [0, 120, 240] as b (b)}
        <g transform={blade(angle + b)}>
          <path d="M{cx},{cy} L{cx - 3 - pt.beta * 0.2},{cy - 60} Q{cx},{cy - 64} {cx + 3 + pt.beta * 0.2},{cy - 60} Z" class="blade" />
        </g>
      {/each}
      <circle {cx} {cy} r="6" class="hub" />
      <!-- converter to grid -->
      <line x1="154" y1={cy} x2="190" y2={cy} class="w" />
      <rect x="190" y={cy - 18} width="56" height="36" rx="5" class="conv" />
      <text x="218" y={cy - 2} class="cv">AC/DC/AC</text>
      <text x="218" y={cy + 11} class="tiny">{tr({ fr: 'convertisseur', en: 'converter' })}</text>
      <line x1="246" y1={cy} x2="290" y2={cy} class="w" />
      <circle cx="306" cy={cy} r="15" class="grid" class:hit={event} />
      <path d="M297,{cy} c3,-7 6,-7 9,0 s6,7 9,0" class="gs" />
      <text x="306" y={cy + 30} class="tiny" class:warn={event}>{num(50 - 0.5 * Math.min(1, Math.max(0, lab.t - WT.tFreq)), 4)} Hz</text>
      {#if !lab.concealed}
        <text x="270" y="140" class="ro" text-anchor="start">P = {num(pt.P, 3)} MW</text>
        <text x="270" y="156" class="ro" text-anchor="start">{num(lab.at('rpm'), 3)} tr/min</text>
        <text x="270" y="172" class="ro" text-anchor="start">λ = {num(pt.lambda, 3)} · β = {num(pt.beta, 3)}°</text>
        <text x="270" y="188" class="ro" text-anchor="start">C<tspan baseline-shift="sub" font-size="7">p</tspan> = {num(pt.cp, 3)}</text>
      {/if}
      <text x="270" y="204" class="tiny" text-anchor="start">{tr({ fr: 'nominal', en: 'rated' })} {num(k.vRated, 3)} m/s · {num(k.rpmRated, 3)} tr/min</text>
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
  .pitch {
    color: var(--c-p);
    font-weight: 700;
    text-transform: none;
  }
  .wind {
    fill: none;
    stroke: var(--c-C);
    stroke-width: 2;
  }
  .tower {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .nacelle {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .blade {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .hub {
    fill: var(--ink);
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .conv {
    fill: var(--panel-2);
    stroke: var(--c-i);
    stroke-width: 2;
  }
  .cv {
    fill: var(--c-i);
    font-size: 9.5px;
    font-weight: 700;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .grid.hit {
    stroke: var(--warn);
  }
  .gs {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.5;
  }
  .lbl {
    fill: var(--c-C);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .tiny {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .tiny.warn {
    fill: var(--warn);
    font-weight: 700;
  }
  .ro {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
</style>
