<script lang="ts">
  // What happened, and when: the sequence of events of the run, plus key figures.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { BlackoutInfo } from '../../lib/models/module0';
  import { S, tr, type L } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as BlackoutInfo);
  const NAME: Record<string, L> = {
    loss: { fr: 'Perte de production (déclenchements)', en: 'Generation lost (trips)' },
    embedded: { fr: 'Production décentralisée déconnectée (protection RoCoF)', en: 'Embedded generation disconnected (RoCoF protection)' },
    lfdd: { fr: 'Délestage automatique sous 48,8 Hz', en: 'Automatic load shedding below 48.8 Hz' },
  };
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Chronologie', en: 'Timeline' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <ol class="events">
      {#each k.events as e (e.kind)}
        <li class={e.kind} class:past={lab.t >= e.t}>
          <span class="t">t = {si(e.t, 's')}</span>
          <span class="what">{tr(NAME[e.kind])}</span>
          <span class="mw">{e.kind === 'lfdd' ? '+' : '−'}{num(e.mw, 4)} MW</span>
        </li>
      {/each}
    </ol>
    <dl>
      <dt>{tr({ fr: 'RoCoF initial', en: 'Initial RoCoF' })}</dt>
      <dd class:bad={k.rocof0 > 0.125}>{num(k.rocof0, 3)} Hz/s</dd>
      <dt>{tr({ fr: 'Creux de fréquence', en: 'Frequency nadir' })}</dt>
      <dd class:bad={k.nadir < 49.2}>{num(k.nadir, 4)} Hz {tr({ fr: 'à', en: 'at' })} {si(k.tNadir, 's')}</dd>
      <dt>{tr({ fr: 'Énergie cinétique stockée', en: 'Stored kinetic energy' })}</dt>
      <dd>{num(k.energy / 1000, 3)} GW·s</dd>
    </dl>
  </div>
</section>

<style>
  .events {
    list-style: none;
    margin: 0 0 8px;
    padding: 0;
  }
  .events li {
    display: grid;
    grid-template-columns: 70px 1fr auto;
    gap: 8px;
    padding: 4px 6px;
    border-left: 3px solid var(--line);
    font-size: 12.5px;
    opacity: 0.45;
  }
  .events li.past {
    opacity: 1;
  }
  .events li.loss {
    border-color: var(--warn);
  }
  .events li.embedded {
    border-color: #c0392b;
  }
  .events li.lfdd {
    border-color: var(--accent);
  }
  .t,
  .mw {
    font-family: var(--mono);
    font-size: 11.5px;
  }
  dl {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    margin: 0;
    font-size: 12.5px;
  }
  dt {
    color: var(--muted);
  }
  dd {
    margin: 0;
    font-family: var(--mono);
    text-align: right;
  }
  dd.bad {
    color: var(--warn);
    font-weight: 700;
  }
</style>
