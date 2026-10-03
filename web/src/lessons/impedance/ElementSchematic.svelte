<script lang="ts">
  // An AC source feeding R, L, C, or a series RL / RC pair.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { KINDS, type ImpedanceInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const kind = $derived(lab.params.kind);
  const k = $derived(lab.info as ImpedanceInfo);
  const hasR = $derived(kind === KINDS.R || kind === KINDS.RL || kind === KINDS.RC);
  const right = $derived(kind === KINDS.L || kind === KINDS.RL ? 'L' : kind === KINDS.C || kind === KINDS.RC ? 'C' : null);
  const iNow = $derived(lab.at('i'));
  const iPeak = $derived(Math.max(1e-30, ...lab.run.s.i.map(Math.abs)));
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class="phi">φ = {lab.concealed ? '?' : `${num(k.phi, 3)}°`}</span>
  </header>
  <div class="body">
    <svg viewBox="-6 0 400 250" role="img" aria-label="AC circuit">
      <path
        class="wire"
        d={`M50,108 V50 ${hasR ? 'H150 M230,50' : ''} H330 ${right ? 'V85 M330,165' : ''} V210 H50 V152`}
      />

      <g class="el" data-term="S" style="color: var(--c-S)" role="presentation" onmouseenter={enter('S')} onmouseleave={leave}>
        <circle cx="50" cy="130" r="22" class="body-fill" />
        <circle cx="50" cy="130" r="22" />
        <path d="M38,130 c4,-12 8,-12 12,0 s8,12 12,0" />
        <text x="82" y="126" class="name" text-anchor="start">V</text>
        <text x="82" y="142" class="val" text-anchor="start">{si(lab.params.V, 'V')} rms</text>
      </g>

      {#if hasR}
        <g class="el" data-term="R" style="color: var(--c-R)" role="presentation" onmouseenter={enter('R')} onmouseleave={leave}>
          <rect x="150" y="38" width="80" height="24" class="body-fill" />
          <path d="M150,50 l7,-10 l13,20 l13,-20 l13,20 l13,-20 l13,20 l8,-10" />
          <text x="190" y="28" class="name">R = {si(lab.params.R, 'Ω')}</text>
        </g>
      {/if}

      {#if right === 'L'}
        <g class="el" data-term="L" style="color: var(--c-L)" role="presentation" onmouseenter={enter('L')} onmouseleave={leave}>
          <rect x="318" y="85" width="24" height="80" class="body-fill" />
          <path d="M330,85 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20 a10,10 0 0 1 0,20" />
          <text x="312" y="122" class="name" text-anchor="end">L = {si(lab.params.L, 'H')}</text>
          <text x="312" y="138" class="val" text-anchor="end">X_L = {si(k.Z.im, 'Ω')}</text>
        </g>
      {:else if right === 'C'}
        <g class="el" data-term="C" style="color: var(--c-C)" role="presentation" onmouseenter={enter('C')} onmouseleave={leave}>
          <rect x="310" y="113" width="40" height="24" class="body-fill" />
          <line x1="312" y1="119" x2="348" y2="119" />
          <line x1="312" y1="131" x2="348" y2="131" />
          <line x1="330" y1="85" x2="330" y2="119" />
          <line x1="330" y1="131" x2="330" y2="165" />
          <text x="304" y="122" class="name" text-anchor="end">C = {si(lab.params.C, 'F')}</text>
          <text x="304" y="138" class="val" text-anchor="end">X_C = {si(k.Z.im, 'Ω')}</text>
        </g>
      {/if}

      <g class="el" data-term="i" style="color: var(--c-i)" role="presentation" onmouseenter={enter('i')} onmouseleave={leave}>
        {#if !lab.concealed}
          <g transform="translate(275,210) scale({iNow >= 0 ? -1 : 1},1)" opacity={0.25 + 0.75 * Math.min(1, Math.abs(iNow) / iPeak)}>
            <path d="M-14,0 H10 M3,-7 L12,0 L3,7" class="arrow" />
          </g>
        {/if}
        <text x="190" y="236" class="val strong">I = {lab.concealed ? '?' : si(Math.hypot(k.I.re, k.I.im), 'A')} rms</text>
      </g>
      <text x="190" y="186" class="zlabel">|Z| = {si(Math.hypot(k.Z.re, k.Z.im), 'Ω')}</text>
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
  .phi {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
    color: var(--ink);
  }
  .wire {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
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
  text:not([text-anchor]) {
    text-anchor: middle;
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
  .arrow {
    stroke-width: 3 !important;
    stroke-linecap: round;
  }
  .zlabel {
    fill: var(--faint);
    font-size: 12px;
    font-family: var(--mono);
  }
</style>
