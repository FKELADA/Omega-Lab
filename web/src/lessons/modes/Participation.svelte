<script lang="ts">
  // Participation factors of the selected mode: the states that take part most
  // (bars), and their total per unit.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { CATEGORY, unitLabel, type ModesInfo } from '../../lib/models/g2data';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ModesInfo);
  const PALETTE = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i', '--c-a', '--c-n', '--c-b', '--c-c'];
  const unitOf = (s: string) => (s.match(/\{((?:SM|GFM|GFL)_\d+)\}/) ?? [])[1] ?? 'réseau';
  const units = $derived(Object.keys(k.net.free).concat(Object.keys(k.sel.units)).filter((u, j, a) => a.indexOf(u) === j));
  const color = (u: string) => `var(${PALETTE[Math.max(0, units.indexOf(u)) % PALETTE.length]})`;
  const max = $derived(Math.max(...k.sel.top.map(([, v]) => v), 1e-9));
  /** "dw_r_{SM_3}" → "dw_r (G3)" */
  const stateLabel = (s: string) => {
    const u = unitOf(s);
    return `${s.replace(/_\{[^}]*\}$/, '').replace(/\{[^}]*\}/, '')} (${u === 'réseau' ? tr({ fr: 'réseau', en: 'network' }) : unitLabel(u)})`;
  };
  const unitsSorted = $derived(Object.entries(k.sel.units).sort((a, b) => b[1] - a[1]));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Facteurs de participation', en: 'Participation factors' })}</span></header>
  {#if lab.concealed}<div class="concealed">…</div>{/if}
  <div class="body">
    <p class="mode">
      {tr({ fr: 'Mode', en: 'Mode' })} {k.index + 1} : {num(k.sel.f, 3)} Hz, ζ = {num(k.sel.zeta, 3)} % — {tr(CATEGORY[k.sel.category] ?? { fr: k.sel.category, en: k.sel.category })}
    </p>
    <div class="stack" title={tr({ fr: 'participation totale par unité', en: 'total participation per unit' })}>
      {#each unitsSorted as [u, v] (u)}
        <span style="width: {100 * v}%; background: {color(u)}">{v > 0.08 ? unitLabel(u) : ''}</span>
      {/each}
    </div>
    <div class="bars">
      {#each k.sel.top as [s, v] (s)}
        <div class="row">
          <span class="lbl">{stateLabel(s)}</span>
          <span class="track"><span class="bar" style="width: {(100 * v) / max}%; background: {color(unitOf(s))}"></span></span>
          <span class="val">{num(100 * v, 2)} %</span>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .mode {
    margin: 0 0 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .stack {
    display: flex;
    height: 18px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .stack span {
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .row {
    display: grid;
    grid-template-columns: 112px 1fr 46px;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    margin: 2px 0;
  }
  .lbl {
    font-family: var(--mono);
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .track {
    height: 9px;
    background: var(--panel-2);
    border-radius: 3px;
  }
  .bar {
    display: block;
    height: 100%;
    border-radius: 3px;
  }
  .val {
    font-family: var(--mono);
    color: var(--muted);
    text-align: right;
  }
</style>
