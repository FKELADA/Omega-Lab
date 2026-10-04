<script lang="ts">
  // One-line diagram across three voltage zones. Each element shows its value in
  // ohms (what the nameplate or the cable table gives) and in pu (what you compute with).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { PU_SYSTEM, busVoltages, type PerUnitInfo } from '../../lib/models/module2b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as PerUnitInfo);
  const buses = $derived(busVoltages(k));
  const zoneColor = ['--c-a', '--c-n', '--c-vs'];
  const xs = [52, 152, 262, 352]; // bus positions
  const zSI = $derived([
    cabs(k.zT1) * k.zones[0].Zb,
    Math.hypot(PU_SYSTEM.line.R, PU_SYSTEM.line.X),
    cabs(k.zT2) * k.zones[1].Zb,
  ]);
  const zPU = $derived([cabs(k.zT1), cabs(k.zLine), cabs(k.zT2)]);
  const vSI = (j: number) => cabs(buses[j]) * k.zones[j === 0 ? 0 : j === 3 ? 2 : 1].Vb;
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Schéma unifilaire', en: 'One-line diagram' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 400 250" role="img" aria-label="One-line diagram">
      <!-- zones -->
      <rect x="0" y="20" width="102" height="200" class="zone" style="fill: var({zoneColor[0]})" />
      <rect x="102" y="20" width="206" height="200" class="zone" style="fill: var({zoneColor[1]})" />
      <rect x="308" y="20" width="92" height="200" class="zone" style="fill: var({zoneColor[2]})" />
      {#each k.zones as z, j (j)}
        <text x={[51, 205, 354][j]} y="36" class="zl" style="fill: var({zoneColor[j]})">{si(z.Vb, 'V')}</text>
      {/each}

      <line x1="30" y1="120" x2="380" y2="120" class="w" />
      <!-- generator -->
      <circle cx="22" cy="120" r="14" class="g" />
      <text x="22" y="125" class="gl">G</text>
      <!-- T1 -->
      <circle cx="96" cy="120" r="11" class="t" /><circle cx="108" cy="120" r="11" class="t" />
      <!-- line -->
      <rect x="185" y="112" width="44" height="16" class="ln" />
      <!-- T2 -->
      <circle cx="302" cy="120" r="11" class="t" /><circle cx="314" cy="120" r="11" class="t" />
      <!-- load -->
      <path d="M380,120 v22 m-7,-8 l7,10 l7,-10" class="w" />

      {#each [[102, 'T1'], [207, 'L'], [308, 'T2']] as [x, name], j (j)}
        <text x={x as number} y="92" class="el">{name === 'L' ? tr({ fr: 'Ligne', en: 'Line' }) : name}</text>
        <text x={x as number} y="158" class="ohm">{si(zSI[j], 'Ω')}</text>
        <text x={x as number} y="172" class="pu">{num(zPU[j], 3)} pu</text>
      {/each}

      {#each xs as x, j (j)}
        <line x1={x} y1="104" x2={x} y2="136" class="bus" />
        <text x={x} y="198" class="v" class:bad={Math.abs(cabs(buses[j]) - 1) > 0.05}>{num(cabs(buses[j]), 3)} pu</text>
        <text x={x} y="212" class="ohm">{si(vSI(j), 'V')}</text>
      {/each}
      <text x="394" y="160" class="ohm" text-anchor="end">{si(k.Pload, 'W')}</text>
      <text x="200" y="244" class="small">S_base = {si(lab.params.Sbase, 'VA')} · {tr({ fr: 'prise T2', en: 'T2 tap' })} {num(lab.params.tap, 3)}</text>
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
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .zone {
    opacity: 0.08;
  }
  .zl {
    font-size: 13px;
    font-weight: 700;
  }
  .w {
    stroke: var(--muted);
    stroke-width: 2;
    fill: none;
  }
  .g,
  .t {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 2;
  }
  .gl {
    fill: var(--ink);
    font-weight: 700;
    font-size: 13px;
  }
  .ln {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .bus {
    stroke: var(--ink);
    stroke-width: 4;
  }
  .el {
    fill: var(--ink);
    font-size: 12px;
    font-weight: 600;
  }
  .ohm {
    fill: var(--muted);
    font-size: 10.5px;
    font-family: var(--mono);
  }
  .pu {
    fill: var(--accent);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 600;
  }
  .v {
    fill: var(--ink);
    font-size: 11.5px;
    font-family: var(--mono);
    font-weight: 600;
  }
  .v.bad {
    fill: var(--warn);
  }
  .small {
    fill: var(--faint);
    font-size: 10.5px;
  }
</style>
