<script lang="ts">
  // Generator — reactance — infinite bus. The rotor arrow turns by δ(t) against
  // the grid's reference arrow; past 180° the machine slips a pole.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { SmibInfo } from '../../lib/models/module3';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as SmibInfo);
  const d = $derived((lab.at('delta') * Math.PI) / 180);
  const slipping = $derived(lab.at('delta') > 180);
  const R = 46;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Machine – réseau infini', en: 'Machine – infinite bus' })}</span>
    <span class="spacer"></span>
    {#if k.lostSync}<span class="warn">{tr({ fr: 'perte de synchronisme', en: 'loss of synchronism' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" role="img" aria-label="Single machine infinite bus">
      <!-- one-line -->
      <circle cx="40" cy="60" r="18" class="g" />
      <text x="40" y="65" class="gl">G</text>
      <line x1="58" y1="60" x2="160" y2="60" class="w" />
      <rect x="160" y="50" width="70" height="20" rx="3" class="x" />
      <text x="195" y="44" class="small">X</text>
      <line x1="230" y1="60" x2="330" y2="60" class="w" />
      <line x1="330" y1="36" x2="330" y2="84" class="bus" />
      <text x="355" y="64" class="small" text-anchor="start">∞</text>
      <text x="120" y="96" class="val">P<tspan baseline-shift="sub" font-size="9">e</tspan> = {num(lab.at('pe'), 3)} pu</text>
      <text x="280" y="96" class="val">P<tspan baseline-shift="sub" font-size="9">m</tspan> = {num(lab.at('pm'), 3)} pu</text>

      <!-- rotor angle dial -->
      <g transform="translate(200,165)">
        <circle r={R} class="dial" />
        <line x1="0" y1="0" x2={R} y2="0" class="ref" />
        <text x={R + 6} y="4" class="small" text-anchor="start">{tr({ fr: 'réseau', en: 'grid' })}</text>
        <line x1="0" y1="0" x2={R * Math.cos(d)} y2={-R * Math.sin(d)} class="rotor" class:bad={slipping} />
        <circle cx={R * Math.cos(d)} cy={-R * Math.sin(d)} r="4" class="tip" class:bad={slipping} />
        <path
          d="M18,0 A18,18 0 {((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? 1 : 0} 0 {18 * Math.cos(d)},{-18 * Math.sin(d)}"
          class="arc"
        />
      </g>
      <text x="70" y="160" class="big">δ = {num(lab.at('delta'), 3)}°</text>
      <text x="70" y="180" class="val">Δf = {si(lab.at('df'), 'Hz')}</text>
      <text x="330" y="160" class="small">δ₀ = {num((k.delta0 * 180) / Math.PI, 3)}°</text>
      <text x="330" y="176" class="small">δ<tspan baseline-shift="sub" font-size="8">u</tspan> = {num((k.deltaU * 180) / Math.PI, 3)}°</text>
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
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .warn {
    color: var(--warn);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 700;
  }
  .g,
  .x {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.8;
  }
  .gl {
    fill: var(--ink);
    font-weight: 700;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 5;
  }
  .small {
    fill: var(--muted);
    font-size: 11px;
  }
  .val {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .big {
    fill: var(--ink);
    font-size: 16px;
    font-weight: 700;
    font-family: var(--mono);
  }
  .dial {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .ref {
    stroke: var(--c-S);
    stroke-width: 2;
    stroke-dasharray: 4 3;
  }
  .rotor {
    stroke: var(--accent);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .rotor.bad,
  .tip.bad {
    stroke: var(--warn);
    fill: var(--warn);
  }
  .tip {
    fill: var(--accent);
  }
  .arc {
    fill: none;
    stroke: var(--accent);
  }
</style>
