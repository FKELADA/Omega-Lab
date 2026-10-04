<script lang="ts">
  // The load mix: constant impedance (heaters), constant current, constant power
  // (electronics), plus a share that slowly recovers (thermostats, tap changers).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { LoadInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LoadInfo);
  const items = $derived([
    { key: 'Z', w: k.w.z * (1 - lab.params.dyn), color: '--c-R', name: { fr: 'Impédance constante (chauffage)', en: 'Constant impedance (heating)' } },
    { key: 'I', w: k.w.i * (1 - lab.params.dyn), color: '--c-i', name: { fr: 'Courant constant', en: 'Constant current' } },
    { key: 'P', w: k.w.p * (1 - lab.params.dyn), color: '--c-C', name: { fr: 'Puissance constante (électronique)', en: 'Constant power (electronics)' } },
    { key: 'D', w: lab.params.dyn, color: '--c-L', name: { fr: 'Charge qui se rétablit', en: 'Recovering load' } },
  ]);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Composition de la charge', en: 'Load composition' })}</span></header>
  <div class="body">
    <div class="meters">
      <div class="m"><span>V</span><b>{num(lab.at('v'), 3)} pu</b></div>
      <div class="m"><span>P</span><b>{lab.concealed ? '?' : `${num(lab.at('p'), 3)} pu`}</b></div>
      <div class="m"><span>I</span><b>{lab.concealed ? '?' : `${num(lab.at('i'), 3)} pu`}</b></div>
    </div>
    {#each items as it (it.key)}
      <div class="row">
        <span class="name">{tr(it.name)}</span>
        <div class="track"><div class="fill" style="width: {100 * it.w}%; background: var({it.color})"></div></div>
        <span class="pct">{num(100 * it.w, 3)} %</span>
      </div>
    {/each}
  </div>
</section>

<style>
  .meters {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 12px;
  }
  .m {
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 6px 10px;
  }
  .m span {
    display: block;
    font-size: 11px;
    color: var(--muted);
  }
  .m b {
    font-family: var(--mono);
    font-size: 17px;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) 1fr 52px;
    gap: 8px;
    align-items: center;
    margin: 5px 0;
    font-size: 12.5px;
  }
  .track {
    height: 12px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
  }
  .fill {
    height: 100%;
  }
  .pct {
    font-family: var(--mono);
    font-size: 11.5px;
    text-align: right;
  }
</style>
