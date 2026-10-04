<script lang="ts">
  // Losses for sending 1 GW over 300 km, at each possible transmission voltage.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { lineLoss } from '../../lib/models/module0';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const levels = [20, 63, 225, 400];
  const rows = $derived(levels.map((kV) => ({ kV, ...lineLoss(kV) })));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Pourquoi la haute tension', en: 'Why high voltage' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <p class="ctx">{tr({ fr: 'Transporter 1 GW sur 300 km (0,01 Ω/km par phase)', en: 'Sending 1 GW over 300 km (0.01 Ω/km per phase)' })}</p>
    {#each rows as r (r.kV)}
      <div class="row" class:cur={r.kV === lab.params.kV}>
        <span class="kv">{r.kV} kV</span>
        <div class="track"><div class="fill" class:bad={r.share > 0.1} style="width: {Math.min(100, 100 * r.share)}%"></div></div>
        <span class="num">{r.share > 1 ? '> 100 %' : `${num(100 * r.share, 3)} %`}</span>
        <span class="cur-a">{si(r.I, 'A')}</span>
      </div>
    {/each}
    <p class="note">
      {tr({
        fr: 'Pertes = 3RI², avec I = P/(√3 V) : diviser la tension par 2 multiplie les pertes par 4.',
        en: 'Losses = 3RI², with I = P/(√3 V): halving the voltage multiplies the losses by 4.',
      })}
    </p>
  </div>
</section>

<style>
  .ctx {
    font-size: 12px;
    color: var(--muted);
    margin: 0 0 6px;
  }
  .row {
    display: grid;
    grid-template-columns: 52px 1fr 64px 56px;
    gap: 8px;
    align-items: center;
    padding: 3px 4px;
    border-radius: 5px;
    font-size: 12.5px;
  }
  .row.cur {
    background: var(--accent-soft);
    font-weight: 700;
  }
  .kv {
    font-family: var(--mono);
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
    background: var(--good);
  }
  .fill.bad {
    background: var(--warn);
  }
  .num,
  .cur-a {
    font-family: var(--mono);
    text-align: right;
    font-size: 11.5px;
  }
  .cur-a {
    color: var(--muted);
  }
  .note {
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }
</style>
