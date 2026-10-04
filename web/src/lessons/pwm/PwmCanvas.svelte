<script lang="ts">
  // Three-phase two-level inverter at the instant under the cursor: each leg's
  // upper or lower switch is on, which gives one of the eight space vectors.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { carrier, modulating, PWM } from '../../lib/models/module6';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const th = $derived(2 * Math.PI * PWM.f1 * lab.t);
  const c = $derived(carrier(th, lab.params.mf));
  const legs = $derived([0, 1, 2].map((j) => (modulating(lab.params.m, lab.params.method, th, j) >= c ? 1 : 0)));
  const code = $derived(legs.join(''));
  const vecName = $derived(
    code === '000' || code === '111' ? `V0 (${code})` : `V${['100', '110', '010', '011', '001', '101'].indexOf(code) + 1} (${code})`,
  );
  const xs = [150, 220, 290];
  const names = ['a', 'b', 'c'];
  const sw = (x: number, y: number, on: boolean) => ({ x, y, on });
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Onduleur triphasé à deux niveaux', en: 'Three-phase two-level inverter' })}</span>
    <span class="spacer"></span>
    <span class="vec">{vecName}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="Two-level inverter">
      <!-- DC link -->
      <line x1="60" y1="24" x2="320" y2="24" class="w" />
      <line x1="60" y1="186" x2="320" y2="186" class="w" />
      <line x1="60" y1="24" x2="60" y2="94" class="w" /><line x1="60" y1="116" x2="60" y2="186" class="w" />
      <line x1="46" y1="94" x2="74" y2="94" class="cap" /><line x1="46" y1="102" x2="74" y2="102" class="cap" />
      <line x1="46" y1="110" x2="74" y2="110" class="cap" /><line x1="46" y1="118" x2="74" y2="118" class="cap" />
      <text x="30" y="58" class="lbl">+{PWM.Vdc / 2}</text>
      <text x="30" y="160" class="lbl">−{PWM.Vdc / 2}</text>
      <text x="30" y="110" class="lbl">N</text>

      {#each xs as x, j (x)}
        {@const s = [sw(x, 62, legs[j] === 1), sw(x, 148, legs[j] === 0)]}
        <line x1={x} y1="24" x2={x} y2="186" class="w" />
        {#each s as k, i (i)}
          <rect x={x - 11} y={k.y - 15} width="22" height="30" rx="3" class="sw" class:on={k.on} />
          <text x={x} y={k.y + 4} class="st" class:on={k.on}>{k.on ? 'ON' : 'off'}</text>
        {/each}
        <line x1={x} y1="105" x2="360" y2={80 + j * 25} class="w out" style="stroke: var(--c-{names[j]})" />
        <circle cx={x} cy="105" r="3" class="dot" />
        <text x="372" y={84 + j * 25} class="ph" style="fill: var(--c-{names[j]})">{names[j]}</text>
      {/each}
      {#if !lab.concealed}
        <text x="200" y="206" class="small">
          m = {num(lab.params.m, 3)} · m<tspan baseline-shift="sub" font-size="7">f</tspan> = {lab.params.mf} · f<tspan baseline-shift="sub" font-size="7">s</tspan> = {num(lab.params.mf * PWM.f1, 4)} Hz · V<tspan baseline-shift="sub" font-size="7">dc</tspan> = {PWM.Vdc} V
        </text>
      {/if}
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
  .vec {
    color: var(--c-p);
    font-weight: 700;
    font-family: var(--mono);
    text-transform: none;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .w.out {
    stroke-width: 1.6;
  }
  .cap {
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .sw {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .sw.on {
    fill: var(--c-i);
    stroke: var(--c-i);
  }
  .st {
    fill: var(--muted);
    font-size: 9px;
    font-weight: 700;
  }
  .st.on {
    fill: var(--panel);
  }
  .dot {
    fill: var(--ink);
  }
  .ph {
    font-size: 11px;
    font-weight: 700;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .small {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
</style>
