<script lang="ts">
  // A source across a resistor that glows with the instantaneous power p(t).
  // With a sine source the glow pulses at twice the supply frequency and never goes
  // dark-negative: power into a resistor is always ≥ 0. The gauge is the average.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { SHAPES } from '../../lib/models/waveform';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const pMax = $derived(Math.max(1e-30, ...lab.run.s.p));
  const glow = $derived(lab.concealed ? 0 : lab.at('p') / pMax);
  const avgFrac = $derived(lab.info.P / pMax);
  const shape = $derived(lab.params.shape);

  const glyph = $derived(
    shape === SHAPES.square
      ? 'M36,136 v-12 h7 v12 h7 v-12 h7 v12'
      : shape === SHAPES.triangle
        ? 'M36,130 l5,-8 l9,16 l9,-16 l4,8'
        : shape === SHAPES.dc
          ? ''
          : 'M38,130 c4,-12 8,-12 12,0 s8,12 12,0',
  );
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="hint">{tr(S.clickToProbe)}</span>
  </header>
  <div class="body">
    <svg viewBox="-6 0 400 250" role="img" aria-label="Source and resistor">
      <defs>
        <radialGradient id="heat">
          <stop offset="0%" stop-color="#ffb347" stop-opacity="0.95" />
          <stop offset="60%" stop-color="#ff5e2b" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#ff5e2b" stop-opacity="0" />
        </radialGradient>
      </defs>
      <path class="wire" d="M50,108 V50 H150 M230,50 H290 V210 H50 V152" />

      <g
        class="el"
        data-term="S"
        style="color: var(--c-S)"
        role="button"
        tabindex="0"
        onmouseenter={enter('S')}
        onmouseleave={leave}
        onclick={() => lab.toggleSignal('v')}
        onkeydown={(e) => e.key === 'Enter' && lab.toggleSignal('v')}
      >
        <circle cx="50" cy="130" r="22" class="body-fill" />
        <circle cx="50" cy="130" r="22" />
        {#if glyph}<path d={glyph} />{:else}
          <text x="50" y="124" class="sign">+</text>
          <text x="50" y="146" class="sign">−</text>
        {/if}
        <text x="82" y="126" class="name" text-anchor="start">v</text>
        <text x="82" y="142" class="val" text-anchor="start">{si(lab.at('v'), 'V')}</text>
      </g>

      <!-- resistor with heat glow -->
      <ellipse cx="190" cy="50" rx="70" ry="38" fill="url(#heat)" opacity={glow} />
      <g
        class="el"
        data-term="R"
        style="color: var(--c-R)"
        role="button"
        tabindex="0"
        onmouseenter={enter('R')}
        onmouseleave={leave}
        onclick={() => lab.toggleSignal('p')}
        onkeydown={(e) => e.key === 'Enter' && lab.toggleSignal('p')}
      >
        <rect x="150" y="38" width="80" height="24" class="body-fill" opacity="0.6" />
        <path d="M150,50 l7,-10 l13,20 l13,-20 l13,20 l13,-20 l13,20 l8,-10" />
        <text x="190" y="22" class="name">R = {si(lab.params.R, 'Ω')}</text>
        <text x="190" y="104" class="val">p = {lab.concealed ? '?' : si(lab.at('p'), 'W')}</text>
      </g>

      <g class="el" data-term="i" style="color: var(--c-i)">
        <text x="282" y="134" class="val strong" text-anchor="end">i = {si(lab.at('i'), 'A')}</text>
      </g>

      <!-- average-power gauge -->
      <g class="gauge" data-term="P">
        <rect x="340" y="40" width="16" height="170" rx="8" class="tube" />
        <rect
          x="340"
          y={210 - 170 * (lab.concealed ? 0 : avgFrac)}
          width="16"
          height={170 * (lab.concealed ? 0 : avgFrac)}
          rx="8"
          class="fill"
        />
        <text x="348" y="230" class="val">P̄</text>
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
  .wire {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
  }
  .el {
    cursor: pointer;
    outline: none;
  }
  .el path,
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
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .sign {
    fill: currentColor;
    font-size: 15px;
    font-weight: 600;
  }
  .name {
    fill: currentColor;
    font-size: 13px;
    font-weight: 600;
  }
  .val {
    fill: var(--muted);
    font-size: 11.5px;
    font-family: var(--mono);
  }
  .val.strong {
    fill: currentColor;
    font-weight: 600;
  }
  .tube {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .fill {
    fill: var(--c-P);
  }
</style>
