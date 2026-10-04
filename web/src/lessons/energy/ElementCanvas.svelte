<script lang="ts">
  // A source driving one element. The tank shows the energy stored in L or C (or
  // burnt in R); the arrow shows which way power flows right now: into the
  // element, or back to the source.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { ELEMENTS, type ElementInfo } from '../../lib/models/module1b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as ElementInfo);
  const el = $derived(lab.params.el);
  const term = $derived(el === ELEMENTS.R ? 'R' : el === ELEMENTS.L ? 'L' : 'C');
  const p = $derived(lab.at('p'));
  const pMax = $derived(Math.max(1e-30, ...lab.run.s.p.map(Math.abs)));
  const level = $derived(lab.concealed ? 0 : Math.min(1, lab.at('w') / Math.max(1e-30, Math.max(...lab.run.s.w))));
  const flowIn = $derived(p >= 0);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="hint">{k.driven === 'i' ? tr({ fr: 'source de courant', en: 'current source' }) : tr({ fr: 'source de tension', en: 'voltage source' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 230" role="img" aria-label="Source and element">
      <path d="M50,100 V40 H210 M210,190 H50 V140" class="wire" />
      <!-- source -->
      <g data-term="S" style="color: var(--c-S)">
        <circle cx="50" cy="120" r="20" class="fillp" />
        <circle cx="50" cy="120" r="20" class="sym" />
        {#if k.driven === 'i'}
          <path d="M50,132 V108 M44,114 L50,106 L56,114" class="sym" />
        {:else}
          <text x="50" y="114" class="sign">+</text>
          <text x="50" y="134" class="sign">−</text>
        {/if}
      </g>
      <!-- element -->
      <g data-term={term} style="color: var(--c-{term})">
        <line x1="210" y1="40" x2="210" y2="80" class="sym" />
        <line x1="210" y1="150" x2="210" y2="190" class="sym" />
        {#if el === ELEMENTS.R}
          <path d="M210,80 l-10,6 l20,12 l-20,12 l20,12 l-20,12 l10,6" class="sym" />
        {:else if el === ELEMENTS.L}
          <path d="M210,80 a9,9 0 0 1 0,17.5 a9,9 0 0 1 0,17.5 a9,9 0 0 1 0,17.5 a9,9 0 0 1 0,17.5" class="sym" />
        {:else}
          <line x1="210" y1="80" x2="210" y2="108" class="sym" />
          <line x1="192" y1="108" x2="228" y2="108" class="sym" />
          <line x1="192" y1="122" x2="228" y2="122" class="sym" />
          <line x1="210" y1="122" x2="210" y2="150" class="sym" />
        {/if}
        <text x="236" y="112" class="name">{term}</text>
      </g>
      <!-- power arrow -->
      {#if !lab.concealed}
        <g transform="translate(130,40) scale({flowIn ? 1 : -1},1)" opacity={0.2 + 0.8 * Math.abs(p) / pMax}>
          <path d="M-24,0 H18 M8,-9 L20,0 L8,9" class="parrow" />
        </g>
        <text x="130" y="26" class="pl" class:back={!flowIn}>
          {flowIn ? tr({ fr: 'vers l’élément', en: 'into the element' }) : tr({ fr: 'rendue à la source', en: 'back to the source' })}
        </text>
      {/if}
      <!-- energy tank -->
      <g transform="translate(300,40)">
        <rect x="0" y="0" width="60" height="150" rx="8" class="tank" />
        <rect x="0" y={150 - 150 * level} width="60" height={150 * level} rx="8" class="water" class:burn={el === ELEMENTS.R} />
        <text x="30" y="172" class="tl">{el === ELEMENTS.R ? tr({ fr: 'chaleur', en: 'heat' }) : tr({ fr: 'stockée', en: 'stored' })}</text>
        <text x="30" y="188" class="tv">{lab.concealed ? '?' : si(lab.at('w'), 'J')}</text>
      </g>
      <text x="130" y="120" class="val">v = {lab.concealed ? '?' : si(lab.at('v'), 'V')}</text>
      <text x="130" y="138" class="val">i = {lab.concealed ? '?' : si(lab.at('i'), 'A')}</text>
      <text x="130" y="156" class="val">p = {lab.concealed ? '?' : si(p, 'W')}</text>
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
  text {
    text-anchor: middle;
  }
  .hint {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    color: var(--faint);
  }
  .wire {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
  }
  .sym {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linejoin: round;
  }
  .fillp {
    fill: var(--panel);
  }
  .sign {
    fill: currentColor;
    font-size: 15px;
    font-weight: 700;
  }
  .name {
    fill: currentColor;
    font-size: 15px;
    font-weight: 700;
  }
  .parrow {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .pl {
    fill: var(--c-p);
    font-size: 11px;
  }
  .pl.back {
    fill: var(--warn);
  }
  .tank {
    fill: var(--panel-2);
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .water {
    fill: var(--c-C);
    opacity: 0.6;
  }
  .water.burn {
    fill: var(--c-R);
  }
  .tl {
    fill: var(--muted);
    font-size: 11px;
  }
  .tv,
  .val {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
  }
</style>
