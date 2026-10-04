<script lang="ts">
  // Two areas of two machines joined by a long tie line. Under each machine, a
  // bar shows its share in the selected mode (up/down = in phase/opposition);
  // the machine glyph tints with its speed deviation at the cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { MACHINES, modeOf, type TwoAreaInfo } from '../../lib/models/module8b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as TwoAreaInfo);
  const m = $derived(modeOf(k, lab.params.mode));
  const gx = [40, 110, 290, 360];
  const COL = ['--c-p', '--c-R', '--c-S', '--c-C'];
  const KINDS = [{ fr: 'inter-zones', en: 'inter-area' }, { fr: 'local, zone 1', en: 'local, area 1' }, { fr: 'local, zone 2', en: 'local, area 2' }];
  const dw = $derived(MACHINES.map((_, i) => (lab.concealed ? 0 : lab.at(`dw${i + 1}`))));
  const tieW = $derived(1 + 3 / lab.params.Xt);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Deux zones, quatre machines', en: 'Two areas, four machines' })}</span>
    <span class="spacer"></span>
    <span class:warn={m.zeta < 0.05} class:ok={m.zeta >= 0.05}>{num(m.freq, 3)} Hz · ζ = {num(100 * m.zeta, 3)} %</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" text-anchor="middle" role="img" aria-label="Two-area system with mode shape">
      <rect x="10" y="10" width="160" height="110" rx="8" class="area" />
      <rect x="230" y="10" width="160" height="110" rx="8" class="area" />
      <text x="90" y="24" class="lbl">{tr({ fr: 'Zone 1', en: 'Area 1' })}</text>
      <text x="310" y="24" class="lbl">{tr({ fr: 'Zone 2', en: 'Area 2' })}</text>
      <!-- area buses and tie -->
      <line x1="40" y1="92" x2="140" y2="92" class="bus" />
      <line x1="260" y1="92" x2="360" y2="92" class="bus" />
      <line x1="140" y1="92" x2="260" y2="92" class="tie" style="stroke-width: {tieW}" />
      <text x="200" y="84" class="lbl">X<tspan baseline-shift="sub" font-size="7">t</tspan> = {num(lab.params.Xt, 3)} pu</text>
      <text x="200" y="108" class="lbl">P<tspan baseline-shift="sub" font-size="7">tie</tspan> = {num(lab.params.Ptie, 3)} pu →</text>
      {#each MACHINES as g, i (g)}
        <line x1={gx[i]} y1="66" x2={gx[i]} y2="92" class="w" />
        <circle cx={gx[i]} cy="50" r="15" class="gen" class:kick={lab.params.kick === i} style="stroke: var({COL[i]}); fill-opacity: {Math.min(0.9, Math.abs(dw[i]) / 40)}; fill: var({COL[i]})" />
        <text x={gx[i]} y="54" class="gl">{g}</text>
        <!-- mode-shape bar -->
        <line x1={gx[i] - 16} y1="165" x2={gx[i] + 16} y2="165" class="axis" />
        <rect x={gx[i] - 9} y={m.shape[i] >= 0 ? 165 - 35 * m.shape[i] : 165} width="18" height={Math.abs(35 * m.shape[i])} style="fill: var({COL[i]})" />
        <text x={gx[i]} y="205" class="lbl">{num(m.shape[i], 2)}</text>
      {/each}
      <text x="200" y="150" class="lbl">{tr({ fr: 'forme du mode', en: 'mode shape' })}</text>
      <text x="200" y="164" class="lbl">{tr(KINDS[m.kind])}</text>
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
  .ok {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .area {
    fill: var(--panel-2);
    stroke: var(--line);
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .tie {
    stroke: var(--c-L);
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
  }
  .gen {
    stroke-width: 2;
  }
  .gen.kick {
    stroke-width: 3.5;
    stroke-dasharray: 3 2;
  }
  .gl {
    fill: var(--ink);
    font-size: 10px;
    font-weight: 700;
  }
  .axis {
    stroke: var(--muted);
  }
  .lbl {
    fill: var(--muted);
    font-size: 9.5px;
  }
</style>
