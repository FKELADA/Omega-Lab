<script lang="ts">
  // Six-pulse thyristor bridge at the instant under the cursor: the conducting
  // thyristors are lit (three during a commutation overlap), the source
  // inductances, and the smoothed DC side.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { bridgeAt, BRIDGE, overlap, type BridgeInfo } from '../../lib/models/module6';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as BridgeInfo);
  const st = $derived(bridgeAt(2 * Math.PI * BRIDGE.f * lab.t, (lab.params.alpha * Math.PI) / 180, (overlap(lab.params.alpha, lab.params.Ls, lab.params.Id) ?? Math.PI / 3), lab.params.Id));
  const xs = [150, 210, 270];
  const names = ['a', 'b', 'c'];
  // Thyristor numbering: T1, T3, T5 on top; T4, T6, T2 below.
  const topN = [1, 3, 5], botN = [4, 6, 2];
  const conducting = $derived(st.top.filter((i) => i > 1e-6).length + st.bottom.filter((i) => i > 1e-6).length);
  /** Thyristor symbol pointing up (anode below), at (x, y). */
  const thy = (x: number, y: number) => `M${x - 9},${y + 6} h18 l-9,-14 z M${x - 9},${y - 8} h18 M${x + 4},${y - 4} l9,-6`;
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Pont de Graetz à thyristors', en: 'Six-pulse thyristor bridge' })}</span>
    <span class="spacer"></span>
    {#if k.failed}<span class="warn">{tr({ fr: 'échec de commutation', en: 'commutation failure' })}</span>
    {:else if conducting === 3}<span class="ov">{tr({ fr: 'empiètement', en: 'overlap' })}</span>{/if}
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="Thyristor bridge">
      <!-- three-phase source with its inductances -->
      {#each names as ph, j (ph)}
        {@const y = 70 + j * 35}
        <circle cx="28" cy={y} r="10" class="src" style="stroke: var(--c-{ph})" />
        <text x="28" y={y + 4} class="ph" style="fill: var(--c-{ph})">{ph}</text>
        <line x1="38" y1={y} x2="58" y2={y} class="w" />
        <path d="M58,{y} c3,-8 8,-8 11,0 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0" class="ind" />
        <line x1="91" y1={y} x2={xs[j]} y2={y} class="w" class:on={st.top[j] > 1e-6 || st.bottom[j] > 1e-6} style="--c: var(--c-{ph})" />
        <circle cx={xs[j]} cy={y} r="2.5" class="dot" />
      {/each}
      <text x="75" y="54" class="lbl">L<tspan baseline-shift="sub" font-size="8">s</tspan></text>

      <!-- rails -->
      <line x1="150" y1="22" x2="320" y2="22" class="w" class:on={true} />
      <line x1="150" y1="188" x2="320" y2="188" class="w" class:on={true} />
      {#each xs as x, j (x)}
        {@const y = 70 + j * 35}
        <line x1={x} y1="22" x2={x} y2={y} class="w" class:on={st.top[j] > 1e-6} />
        <line x1={x} y1={y} x2={x} y2="188" class="w" class:on={st.bottom[j] > 1e-6} />
        <path d={thy(x, 42)} class="thy" class:on={st.top[j] > 1e-6} />
        <text x={x - 16} y="46" class="tn">T{topN[j]}</text>
        <path d={thy(x, 162)} class="thy" class:on={st.bottom[j] > 1e-6} />
        <text x={x - 16} y="166" class="tn">T{botN[j]}</text>
      {/each}

      <!-- DC side: smoothing inductor and load carrying Id -->
      <path d="M320,22 h10 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0 c3,-8 8,-8 11,0 h10" class="ind" />
      <line x1="373" y1="22" x2="373" y2="80" class="w on" />
      <rect x="363" y="80" width="20" height="50" rx="3" class="load" />
      <line x1="373" y1="130" x2="373" y2="188" class="w on" />
      <line x1="320" y1="188" x2="373" y2="188" class="w on" />
      <text x="345" y="12" class="lbl">I<tspan baseline-shift="sub" font-size="8">d</tspan> = {num(lab.params.Id, 3)} A</text>
      {#if !lab.concealed}
        <text x="340" y="110" class="v" text-anchor="end">v<tspan baseline-shift="sub" font-size="8">d</tspan></text>
        <text x="340" y="126" class="v" text-anchor="end">{num(st.vd, 3)} V</text>
        <text x="200" y="206" class="small">α = {num(lab.params.alpha, 3)}° · μ = {k.failed ? '—' : num(k.mu, 3)}° · V<tspan baseline-shift="sub" font-size="7">d</tspan> = {num(k.Vd, 3)} V</text>
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
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .ov {
    color: var(--c-p);
    font-weight: 700;
    text-transform: none;
  }
  .src {
    fill: var(--panel);
    stroke-width: 2;
  }
  .ph {
    font-size: 10px;
    font-weight: 700;
  }
  .w {
    stroke: var(--line);
    stroke-width: 2;
  }
  .w.on {
    stroke: var(--c, var(--c-i));
    stroke-width: 2.6;
  }
  .dot {
    fill: var(--ink);
  }
  .ind {
    fill: none;
    stroke: var(--c-L);
    stroke-width: 2;
  }
  .thy {
    fill: var(--panel);
    stroke: var(--muted);
    stroke-width: 1.6;
  }
  .thy.on {
    fill: var(--c-i);
    stroke: var(--c-i);
  }
  .tn {
    fill: var(--muted);
    font-size: 9px;
  }
  .load {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .lbl {
    fill: var(--muted);
    font-size: 10px;
  }
  .v {
    fill: var(--c-C);
    font-size: 12px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .small {
    fill: var(--ink);
    font-size: 10.5px;
    font-family: var(--mono);
  }
</style>
