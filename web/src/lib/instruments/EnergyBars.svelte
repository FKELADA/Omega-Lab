<script lang="ts">
  // Energy balance at the time cursor: what the source has supplied, against what
  // the inductor and capacitor hold and the resistor has burnt. The two bars are
  // always the same length — that is conservation of energy, made visible.
  import type { Lab } from '../lab/lab.svelte';
  import { S, tr } from '../ui/ui.svelte';
  import { si } from '../ui/format';

  let { lab }: { lab: Lab } = $props();

  const scale = $derived(Math.max(1e-30, ...lab.run.s.wS.map(Math.abs)));
  const parts = $derived([
    { term: 'L', label: 'W_L', name: '½Li²', v: lab.at('wL') },
    { term: 'C', label: 'W_C', name: '½Cv²', v: lab.at('wC') },
    { term: 'R', label: 'W_R', name: '∫Ri²', v: lab.at('wR') },
  ]);
  const wS = $derived(lab.at('wS'));
  const pct = (v: number) => `${Math.max(0, (100 * v) / scale)}%`;
</script>

<section class="panel">
  <header><span>{tr(S.energy)}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <div class="label">{tr(S.supplied)} <b>{si(wS, 'J')}</b></div>
    <div class="bar"><div class="seg" data-term="S" style="width:{pct(wS)}; background: var(--c-S)"></div></div>

    <div class="label">{tr(S.storedLost)}</div>
    <div class="bar">
      {#each parts as p (p.term)}
        <div
          class="seg"
          data-term={p.term}
          style="width:{pct(p.v)}; background: var(--c-{p.term})"
          title="{p.name} = {si(p.v, 'J')}"
          role="presentation"
          onmouseenter={() => (lab.hover = p.term)}
          onmouseleave={() => (lab.hover = null)}
        ></div>
      {/each}
    </div>
    <div class="legend">
      {#each parts as p (p.term)}
        <span style="--c: var(--c-{p.term})"><i></i>{p.name} <b>{si(p.v, 'J')}</b></span>
      {/each}
    </div>
  </div>
</section>

<style>
  .label {
    font-size: 12px;
    color: var(--muted);
    margin-top: 4px;
  }
  .label b {
    color: var(--ink);
    font-family: var(--mono);
    font-weight: 500;
  }
  .bar {
    display: flex;
    height: 18px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 5px;
    overflow: hidden;
    margin: 3px 0 8px;
  }
  .seg {
    height: 100%;
    color: inherit;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 12px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: var(--c);
    margin-right: 5px;
  }
  .legend b {
    font-family: var(--mono);
    font-weight: 500;
    color: var(--ink);
  }
</style>
