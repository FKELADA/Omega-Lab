<script lang="ts">
  // Turbine-generator shaft (HP, LP, generator masses) whose twist follows the
  // torsional torque at the cursor, feeding a line with a series capacitor (or
  // a TCSC). The shaft turns red as the torque grows.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { SSR_MITIGATION, type SsrInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as SsrInfo);
  const T = $derived(lab.concealed ? 0 : lab.at('T'));
  const twist = $derived(Math.max(-1, Math.min(1, T / 0.3)));
  const hot = $derived(Math.abs(T) > 0.3);
  const tcsc = $derived(lab.params.mitig === SSR_MITIGATION.tcsc);
  const masses = [
    { x: 30, r: 16, name: 'HP' },
    { x: 80, r: 22, name: 'BP/LP' },
    { x: 138, r: 26, name: 'G' },
  ];
  // Each mass is drawn rotated: the generator one way, the turbine the other.
  const rotOf = (j: number) => twist * 25 * (j - 1.2);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Groupe turbo-alternateur et ligne compensée', en: 'Turbine-generator and compensated line' })}</span>
    <span class="spacer"></span>
    <span class:warn={k.growing} class:ok={!k.growing}>{k.growing ? tr({ fr: 'résonance', en: 'resonance' }) : tr({ fr: 'amorti', en: 'damped' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 200" text-anchor="middle" role="img" aria-label="Turbine-generator shaft and series-compensated line">
      <line x1="14" y1="80" x2="164" y2="80" class="shaft" class:hot />
      {#each masses as m, j (m.name)}
        <g transform="rotate({rotOf(j)} {m.x} 80)">
          <ellipse cx={m.x} cy="80" rx={m.r * 0.45} ry={m.r} class="mass" class:gen={m.name === 'G'} />
          <line x1={m.x} y1={80 - m.r} x2={m.x} y2={80 - m.r + 10} class="mark" />
        </g>
        <text x={m.x} y={80 + m.r + 14} class="lbl">{m.name}</text>
      {/each}
      <text x="85" y="28" class="lbl">{tr({ fr: 'mode de torsion', en: 'torsional mode' })} f<tspan baseline-shift="sub" font-size="7">m</tspan> = {num(lab.params.fm, 3)} Hz</text>
      <!-- line -->
      <line x1="164" y1="80" x2="214" y2="80" class="w" />
      <path d="M214,80 c5,-12 10,-12 15,0 c5,-12 10,-12 15,0 c5,-12 10,-12 15,0" class="ind" />
      <text x="236" y="58" class="lbl">X<tspan baseline-shift="sub" font-size="7">L</tspan></text>
      <line x1="259" y1="80" x2="284" y2="80" class="w" />
      <line x1="284" y1="64" x2="284" y2="96" class="cap" />
      <line x1="292" y1="64" x2="292" y2="96" class="cap" />
      {#if tcsc}
        <rect x="276" y="100" width="24" height="14" rx="2" class="thy" />
        <path d="M284,100 V96 M292,100 V96" class="w thin" />
        <text x="288" y="128" class="lbl">TCSC</text>
      {:else}
        <text x="288" y="114" class="lbl">X<tspan baseline-shift="sub" font-size="7">C</tspan> = {num(100 * lab.params.k, 2)} % X<tspan baseline-shift="sub" font-size="7">L</tspan></text>
      {/if}
      <line x1="292" y1="80" x2="350" y2="80" class="w" />
      <circle cx="366" cy="80" r="16" class="grid" />
      <path d="M357,80 c3,-7 6,-7 9,0 s6,7 9,0" class="sym" />
      <!-- readouts -->
      <text x="270" y="150" class="ro">f<tspan baseline-shift="sub" font-size="7">er</tspan> = 50√k = {num(k.fer, 3)} Hz</text>
      <text x="270" y="166" class="ro" class:bad={Math.abs(k.fsub - lab.params.fm) < 2 && !tcsc}>50 − f<tspan baseline-shift="sub" font-size="7">er</tspan> = {num(k.fsub, 3)} Hz</text>
      <text x="85" y="166" class="ro" class:bad={hot}>ΔT = {num(T, 3)} pu</text>
      <text x="85" y="182" class="lbl">σ = {num(k.sigma, 3)} 1/s</text>
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
  .ok {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .shaft {
    stroke: var(--muted);
    stroke-width: 5;
  }
  .shaft.hot {
    stroke: var(--warn);
  }
  .mass {
    fill: var(--panel-2);
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .mass.gen {
    stroke: var(--c-R);
  }
  .mark {
    stroke: var(--ink);
    stroke-width: 2;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.thin {
    stroke-width: 1.2;
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.6;
  }
  .thy {
    fill: var(--panel);
    stroke: var(--c-p);
    stroke-width: 1.5;
  }
  .grid {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .sym {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 1.6;
  }
  .lbl {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .ro {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .ro.bad {
    fill: var(--warn);
    font-weight: 700;
  }
</style>
