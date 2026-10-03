<script lang="ts">
  // Two multimeters on the same waveform. A true-RMS meter computes √(mean v²);
  // a cheap average-responding one rectifies, averages and multiplies by the sine
  // form factor 1.111 — right for a sine, wrong for everything else.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { WaveformInfo } from '../../lib/models/waveform';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as WaveformInfo);
  const err = $derived((100 * (k.avgMeter - k.rms)) / k.rms);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Multimètres', en: 'Multimeters' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <div class="meters">
      <div class="meter">
        <div class="kind">{tr({ fr: 'Efficace vrai (TRMS)', en: 'True RMS' })}</div>
        <div class="lcd">{si(k.rms, 'V')}</div>
        <div class="how">√(mean v²)</div>
      </div>
      <div class="meter cheap">
        <div class="kind">{tr({ fr: 'À valeur moyenne', en: 'Average-responding' })}</div>
        <div class="lcd">{si(k.avgMeter, 'V')}</div>
        <div class="how">1,111 × mean|v|</div>
      </div>
    </div>
    <div class="err" class:bad={Math.abs(err) > 0.5}>
      {tr({ fr: 'Erreur du multimètre à valeur moyenne', en: 'Average-responding meter error' })} :
      <b>{err >= 0 ? '+' : ''}{num(err, 3)} %</b>
    </div>
    <dl>
      <dt>{tr({ fr: 'Facteur de crête', en: 'Crest factor' })} V̂/V<sub>rms</sub></dt>
      <dd>{num(k.crest, 4)}</dd>
      <dt>{tr({ fr: 'Facteur de forme', en: 'Form factor' })} V<sub>rms</sub>/|v|<sub>moy</sub></dt>
      <dd>{num(k.form, 4)}</dd>
      <dt>{tr({ fr: 'Puissance moyenne', en: 'Average power' })} P̄</dt>
      <dd>{si(k.P, 'W')}</dd>
    </dl>
  </div>
</section>

<style>
  .meters {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .meter {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px 10px;
    background: var(--panel-2);
  }
  .kind {
    font-size: 12px;
    color: var(--muted);
  }
  .lcd {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--good);
  }
  .cheap .lcd {
    color: var(--warn);
  }
  .how {
    font-size: 11px;
    color: var(--faint);
    font-family: var(--mono);
  }
  .err {
    margin: 10px 0 6px;
    font-size: 13px;
  }
  .err b {
    font-family: var(--mono);
  }
  .err.bad b {
    color: var(--warn);
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
</style>
