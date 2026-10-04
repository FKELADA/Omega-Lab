<script lang="ts">
  // The same corridor built twice: AC (transformers at each end) and DC
  // (converter stations). The winner for the current distance is highlighted.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { MEDIA, type DcAcInfo } from '../../lib/models/module1b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as DcAcInfo);
  const cable = $derived(lab.params.medium === MEDIA.cable);
  const acDead = $derived(k.usableAC <= 0);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Deux façons de transporter', en: 'Two ways to transmit' })}</span>
    <span class="spacer"></span>
    <span class="km">{num(lab.params.km, 3)} km · {cable ? tr({ fr: 'câble', en: 'cable' }) : tr({ fr: 'aérien', en: 'overhead' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" role="img" aria-label="AC and DC links">
      <!-- AC -->
      <g class="link" class:win={!k.dcWins} class:dead={acDead}>
        <text x="12" y="30" class="tag" text-anchor="start">AC</text>
        <circle cx="62" cy="62" r="11" class="tf" /><circle cx="74" cy="62" r="11" class="tf" />
        <path d="M85,62 H315" class={cable ? 'cable' : 'oh'} />
        <circle cx="326" cy="62" r="11" class="tf" /><circle cx="338" cy="62" r="11" class="tf" />
        <path d="M100,62 q10,-10 20,0 t20,0 t20,0" class="sine" />
        <text x="200" y="96" class="v">
          {acDead
            ? tr({ fr: 'courant de charge > courant admissible : impossible', en: 'charging current > rating: impossible' })
            : `${tr({ fr: 'coût', en: 'cost' })} ${num(k.costAC, 3)} · ${tr({ fr: 'courant utile', en: 'usable current' })} ${num(100 * k.usableAC, 3)} %`}
        </text>
      </g>
      <!-- DC -->
      <g class="link" class:win={k.dcWins}>
        <text x="12" y="140" class="tag" text-anchor="start">DC</text>
        <rect x="46" y="156" width="36" height="28" rx="4" class="conv" />
        <text x="64" y="175" class="cs">~/=</text>
        <path d="M82,170 H318" class={cable ? 'cable' : 'oh'} />
        <rect x="318" y="156" width="36" height="28" rx="4" class="conv" />
        <text x="336" y="175" class="cs">=/~</text>
        <path d="M110,166 H170" class="dcl" />
        <text x="200" y="206" class="v">{tr({ fr: 'coût', en: 'cost' })} {num(k.costDC, 3)} · {tr({ fr: 'pas de puissance réactive', en: 'no reactive power' })}</text>
      </g>
      <text x="200" y="226" class="small">{tr({ fr: 'coûts relatifs, illustratifs', en: 'relative, illustrative costs' })} · {tr({ fr: 'seuil de rentabilité', en: 'break-even' })} ≈ {num(k.breakEven, 3)} km</text>
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
  .km {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    color: var(--ink);
  }
  .link {
    opacity: 0.55;
  }
  .link.win {
    opacity: 1;
  }
  .tag {
    fill: var(--ink);
    font-size: 15px;
    font-weight: 700;
  }
  .link.win .tag {
    fill: var(--good);
  }
  .tf {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .conv {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .cs {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .oh {
    stroke: var(--muted);
    stroke-width: 2.5;
  }
  .cable {
    stroke: var(--c-C);
    stroke-width: 6;
    stroke-linecap: round;
  }
  .dead .cable,
  .dead .oh {
    stroke: var(--warn);
  }
  .sine,
  .dcl {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 2;
  }
  .v {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .dead .v {
    fill: var(--warn);
    font-weight: 700;
  }
  .small {
    fill: var(--faint);
    font-size: 10.5px;
  }
</style>
