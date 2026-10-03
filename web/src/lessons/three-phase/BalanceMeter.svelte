<script lang="ts">
  // Per-phase load voltages against the ±10 % supply tolerance (EN 50160), and the
  // line and neutral currents.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import type { ThreePhaseInfo } from '../../lib/models/acCircuits';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as ThreePhaseInfo);
  const Vn = $derived(lab.params.V);
  const vMax = $derived(1.8 * Vn);
  const iMax = $derived(Math.max(1e-9, ...k.I.map(cabs), cabs(k.IN)) * 1.15);
  const pct = (v: number, m: number) => `${Math.min(100, (100 * v) / m)}%`;
  const rows = ['a', 'b', 'c'] as const;
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Équilibre des phases', en: 'Phase balance' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <div class="title">{tr({ fr: 'Tension aux bornes de chaque charge', en: 'Voltage across each load' })}</div>
    {#each rows as r, j (r)}
      {@const U = cabs(k.Vload[j])}
      <div class="row" data-term={r} style="--c: var(--c-{r})">
        <span class="lbl">{r.toUpperCase()}</span>
        <div class="track">
          <div class="band" style="left: {pct(0.9 * Vn, vMax)}; width: {pct(0.2 * Vn, vMax)}"></div>
          <div class="fill" class:bad={Math.abs(U / Vn - 1) > 0.1} style="width: {pct(U, vMax)}"></div>
        </div>
        <span class="num">{si(U, 'V')}</span>
      </div>
    {/each}
    <div class="legend">{tr({ fr: 'bande grisée', en: 'shaded band' })} : {si(Vn, 'V')} ± 10 %</div>

    <div class="title">{tr({ fr: 'Courants', en: 'Currents' })}</div>
    {#each rows as r, j (r)}
      <div class="row" data-term={r} style="--c: var(--c-{r})">
        <span class="lbl">I<sub>{r}</sub></span>
        <div class="track"><div class="fill" style="width: {pct(cabs(k.I[j]), iMax)}"></div></div>
        <span class="num">{si(cabs(k.I[j]), 'A')}</span>
      </div>
    {/each}
    <div class="row" data-term="n" style="--c: var(--c-n)">
      <span class="lbl">I<sub>N</sub></span>
      <div class="track"><div class="fill" style="width: {pct(cabs(k.IN), iMax)}"></div></div>
      <span class="num">{si(cabs(k.IN), 'A')}</span>
    </div>
  </div>
</section>

<style>
  .title {
    font-size: 12px;
    color: var(--muted);
    margin: 4px 0 4px;
  }
  .row {
    display: grid;
    grid-template-columns: 28px 1fr 64px;
    gap: 8px;
    align-items: center;
    margin-bottom: 4px;
    border-radius: 4px;
  }
  .lbl {
    color: var(--c);
    font-weight: 700;
    font-size: 12px;
  }
  .track {
    position: relative;
    height: 12px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: var(--good-soft);
    border-left: 1px solid var(--good);
    border-right: 1px solid var(--good);
  }
  .fill {
    position: absolute;
    left: 0;
    top: 2px;
    bottom: 2px;
    background: var(--c);
    border-radius: 2px;
  }
  .fill.bad {
    background: var(--warn);
  }
  .num {
    font-family: var(--mono);
    font-size: 11.5px;
    text-align: right;
  }
  .legend {
    font-size: 11px;
    color: var(--faint);
    margin-bottom: 6px;
  }
</style>
