<script lang="ts">
  // A three-phase supply feeding a star of resistive loads. The neutral switch is
  // live: click it to break the neutral and watch the star point drift.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import type { ThreePhaseInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as ThreePhaseInfo);
  const closed = $derived(lab.params.neutral === 1);
  const phases = [
    { id: 'a', y: 55, x: 232, R: 'Ra' },
    { id: 'b', y: 85, x: 290, R: 'Rb' },
    { id: 'c', y: 115, x: 348, R: 'Rc' },
  ];
  const live = (j: number) => j === 0 || lab.params.phases === 3;
  const out = (v: number) => Math.abs(v / lab.params.V - 1) > 0.1;
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
  const toggle = () => lab.setParam('neutral', closed ? 0 : 1);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="hint">{tr({ fr: 'Cliquer l’interrupteur du neutre', en: 'Click the neutral switch' })}</span>
  </header>
  <div class="body">
    <svg viewBox="-6 0 400 250" role="img" aria-label="Three-phase star load">
      <!-- source -->
      <rect x="10" y="38" width="56" height="190" rx="8" class="src" />
      <text x="38" y="120" class="srcl">3~</text>
      <text x="38" y="138" class="small">{si(lab.params.V, 'V')}</text>
      <text x="38" y="152" class="small">{si(k.VLL, 'V')}</text>

      {#each phases as ph, j (ph.id)}
        {@const U = cabs(k.Vload[j])}
        <g
          data-term={ph.id}
          style="color: var(--c-{ph.id})"
          class:dead={!live(j)}
          role="presentation"
          onmouseenter={enter(ph.id)}
          onmouseleave={leave}
        >
          <text x="74" y={ph.y - 4} class="ph">{ph.id.toUpperCase()}</text>
          <path class="line" d="M66,{ph.y} H{ph.x} V140" />
          <path class="res" d="M{ph.x},140 l-8,5 l16,6 l-16,6 l16,6 l-16,6 l16,6 l-8,5 V200" />
          {#if live(j)}
            <text x="130" y={ph.y - 4} class="cur">I = {si(cabs(k.I[j]), 'A')}</text>
            <text x={ph.x + 10} y="168" class="u" class:bad={out(U)} text-anchor="start">{si(U, 'V')}</text>
          {/if}
        </g>
      {/each}

      <!-- load star point -->
      <path class="line" d="M232,200 H348" />
      <circle cx="290" cy="200" r="4" class="node" />
      <text x="296" y="194" class="small" text-anchor="start">N′</text>
      {#if !closed}
        <text x="352" y="214" class="shift" text-anchor="end">V_N′ = {si(cabs(k.VN), 'V')}</text>
      {/if}

      <!-- neutral, with its switch -->
      <g data-term="n" style="color: var(--c-n)" role="presentation" onmouseenter={enter('n')} onmouseleave={leave}>
        <path class="line" d="M66,225 H170 M210,225 H290 V200" />
        <text x="74" y="221" class="ph">N</text>
        <g
          class="switch"
          role="switch"
          aria-checked={closed}
          aria-label={tr({ fr: 'Interrupteur du neutre', en: 'Neutral switch' })}
          tabindex="0"
          onclick={toggle}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
        >
          <rect x="160" y="205" width="60" height="34" class="hit" />
          <circle cx="170" cy="225" r="3.5" />
          <circle cx="210" cy="225" r="3.5" />
          <line x1="170" y1="225" x2={closed ? 208 : 202} y2={closed ? 222 : 207} class="blade" />
        </g>
        <text x="250" y="243" class="cur">I_N = {si(cabs(k.IN), 'A')}</text>
      </g>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
    max-height: 250px;
  }
  .hint {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    color: var(--faint);
  }
  .src {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .srcl {
    fill: var(--ink);
    font-size: 18px;
    font-weight: 700;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .small {
    fill: var(--muted);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .line {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
  }
  g:not([style]) > .line,
  svg > .line {
    stroke: var(--muted);
  }
  .res {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linejoin: round;
  }
  .dead {
    opacity: 0.3;
  }
  .ph {
    fill: currentColor;
    font-size: 11px;
    font-weight: 700;
    text-anchor: start;
  }
  .cur {
    fill: currentColor;
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .u {
    fill: var(--muted);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .u.bad {
    fill: var(--warn);
    font-weight: 700;
  }
  .node {
    fill: var(--muted);
  }
  .shift {
    fill: var(--warn);
    font-size: 11.5px;
    font-family: var(--mono);
    font-weight: 600;
  }
  .switch {
    cursor: pointer;
    outline: none;
  }
  .switch .hit {
    fill: transparent;
  }
  .switch:focus-visible .hit {
    fill: var(--hot);
  }
  .switch circle {
    fill: var(--panel);
    stroke: currentColor;
    stroke-width: 2;
  }
  .blade {
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
  }
</style>
