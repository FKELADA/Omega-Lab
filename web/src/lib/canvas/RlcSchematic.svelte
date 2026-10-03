<script lang="ts">
  // The series RLC loop. Hover an element to highlight its term everywhere;
  // click it to probe its voltage on the oscilloscope. The moving dots are the
  // charge that has flowed: their offset is q = C·v_C, so they stop when the
  // capacitor is full and run backwards when the current reverses.
  import type { Lab } from '../lab/lab.svelte';
  import { S, tr } from '../ui/ui.svelte';
  import { si } from '../ui/format';

  let { lab }: { lab: Lab } = $props();

  const hidden = $derived(lab.concealed);
  const flow = $derived(-120 * (lab.at('vC') / lab.params.V));
  const iNow = $derived(lab.at('i'));
  const iPeak = $derived(Math.max(1e-30, ...lab.run.s.i.map(Math.abs)));

  const enter = (term: string) => () => (lab.hover = term);
  const leave = () => (lab.hover = null);
  const probe = (signal: string) => () => lab.toggleSignal(signal);
  const val = (signal: string, unit: string) => (hidden && (signal === 'vR' || signal === 'i') ? '?' : si(lab.at(signal), unit));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Circuit', en: 'Circuit' })}</span>
    <span class="spacer"></span>
    <span class="hint">{tr(S.clickToProbe)}</span>
  </header>
  <div class="body">
    <svg viewBox="-6 0 400 250" role="img" aria-label="Series RLC circuit">
      <!-- wires -->
      <path class="wire" d="M50,100 V50 H75 M115,50 H150 M230,50 H330 V85 M330,165 V210 H210 M190,210 H50 V160" />
      <!-- charge flow -->
      <path
        class="flow"
        class:off={hidden}
        d="M50,140 V50 H330 V210 H50 Z"
        style="stroke-dashoffset:{flow}"
      />

      <!-- source -->
      <g
        class="el"
        data-term="S"
        style="color: var(--c-S)"
        role="button"
        tabindex="0"
        onmouseenter={enter('S')}
        onmouseleave={leave}
        onclick={probe('vS')}
        onkeydown={(ev) => ev.key === 'Enter' && probe('vS')()}
      >
        <circle cx="50" cy="130" r="22" class="body-fill" />
        <circle cx="50" cy="130" r="22" />
        <text x="50" y="124" class="sign">+</text>
        <text x="50" y="146" class="sign">−</text>
        <text x="18" y="134" class="name" text-anchor="end">V</text>
        <text x="18" y="150" class="val" text-anchor="end">{si(lab.params.V, 'V')}</text>
      </g>

      <!-- switch, closed at t = 0 -->
      <g class="switch">
        <circle cx="75" cy="50" r="3" />
        <circle cx="115" cy="50" r="3" />
        <line x1="75" y1="50" x2="113" y2="47" />
        <text x="95" y="36" class="small">t = 0</text>
      </g>

      <!-- resistor -->
      <g
        class="el"
        data-term="R"
        style="color: var(--c-R)"
        role="button"
        tabindex="0"
        onmouseenter={enter('R')}
        onmouseleave={leave}
        onclick={probe('vR')}
        onkeydown={(ev) => ev.key === 'Enter' && probe('vR')()}
      >
        <rect x="150" y="38" width="80" height="24" class="body-fill" />
        <path d="M150,50 l7,-10 l13,20 l13,-20 l13,20 l13,-20 l13,20 l8,-10" />
        <text x="190" y="30" class="name">R = {si(lab.params.R, 'Ω')}</text>
        <text x="190" y="80" class="val" class:on={lab.visible.vR}>v_R = {val('vR', 'V')}</text>
      </g>

      <!-- inductor -->
      <g
        class="el"
        data-term="L"
        style="color: var(--c-L)"
        role="button"
        tabindex="0"
        onmouseenter={enter('L')}
        onmouseleave={leave}
        onclick={probe('vL')}
        onkeydown={(ev) => ev.key === 'Enter' && probe('vL')()}
      >
        <rect x="318" y="85" width="24" height="80" class="body-fill" />
        <path d="M330,85 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20" />
        <text x="352" y="118" class="name" text-anchor="start">L</text>
        <text x="352" y="134" class="val" text-anchor="start">{si(lab.params.L, 'H')}</text>
        <text x="312" y="130" class="val" text-anchor="end" class:on={lab.visible.vL}>v_L = {val('vL', 'V')}</text>
      </g>

      <!-- capacitor -->
      <g
        class="el"
        data-term="C"
        style="color: var(--c-C)"
        role="button"
        tabindex="0"
        onmouseenter={enter('C')}
        onmouseleave={leave}
        onclick={probe('vC')}
        onkeydown={(ev) => ev.key === 'Enter' && probe('vC')()}
      >
        <rect x="188" y="190" width="24" height="40" class="body-fill" />
        <line x1="194" y1="192" x2="194" y2="228" />
        <line x1="206" y1="192" x2="206" y2="228" />
        <text x="200" y="244" class="name">C = {si(lab.params.C, 'F')}</text>
        <text x="200" y="182" class="val" class:on={lab.visible.vC}>v_C = {val('vC', 'V')}</text>
      </g>

      <!-- current arrow, scaled by |i| -->
      <g
        class="el current"
        data-term="i"
        style="color: var(--c-i)"
        role="button"
        tabindex="0"
        onmouseenter={enter('i')}
        onmouseleave={leave}
        onclick={probe('i')}
        onkeydown={(ev) => ev.key === 'Enter' && probe('i')()}
      >
        {#if !hidden}
          <g transform="translate(275,50) scale({iNow >= 0 ? 1 : -1},1)" opacity={0.25 + 0.75 * Math.min(1, Math.abs(iNow) / iPeak)}>
            <path d="M-14,0 H10 M3,-7 L12,0 L3,7" class="arrow" />
          </g>
        {/if}
        <text x="282" y="30" class="val strong">i = {val('i', 'A')}</text>
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
    font-family: var(--font);
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
  .flow {
    fill: none;
    stroke: var(--c-i);
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 0.1 24;
    opacity: 0.85;
  }
  .flow.off {
    opacity: 0;
  }
  .el {
    cursor: pointer;
    outline: none;
  }
  .el path,
  .el line,
  .el circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linejoin: round;
  }
  .el .body-fill {
    fill: var(--panel);
    stroke: none;
  }
  .el:focus-visible .body-fill {
    fill: var(--hot);
  }
  .sign {
    fill: currentColor;
    font-size: 15px;
    font-weight: 600;
    text-anchor: middle;
  }
  .name {
    fill: currentColor;
    font-size: 13px;
    font-weight: 600;
  }
  /* Centred unless the element sets its own anchor (CSS would override the attribute). */
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .val {
    fill: var(--muted);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .val.on {
    fill: currentColor;
  }
  .val.strong {
    fill: currentColor;
    font-weight: 600;
  }
  .switch circle {
    fill: var(--panel);
    stroke: var(--muted);
    stroke-width: 2;
  }
  .switch line {
    stroke: var(--muted);
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .small {
    fill: var(--faint);
    font-size: 11px;
    text-anchor: middle;
  }
  .arrow {
    stroke-width: 3 !important;
    stroke-linecap: round;
  }
</style>
