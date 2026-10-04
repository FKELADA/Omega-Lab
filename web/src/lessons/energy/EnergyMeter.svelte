<script lang="ts">
  // Energy delivered to the element and energy it gave back, up to the time cursor.
  // For L and C the two meet every period; for R nothing ever comes back.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const totals = $derived.by(() => {
    const { t, s } = lab.run;
    let inE = 0, outE = 0;
    for (let k = 1; k <= lab.idx; k++) {
      const e = 0.5 * (s.p[k] + s.p[k - 1]) * (t[k] - t[k - 1]);
      if (e >= 0) inE += e;
      else outE -= e;
    }
    // Scale to the whole run so the bars grow as time runs.
    let allIn = 0;
    for (let k = 1; k < t.length; k++) allIn += Math.max(0, 0.5 * (s.p[k] + s.p[k - 1]) * (t[k] - t[k - 1]));
    return { inE, outE, scale: Math.max(1e-30, allIn) };
  });
  const pct = (v: number) => `${(100 * v) / totals.scale}%`;
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Compteur d’énergie', en: 'Energy meter' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <div class="lbl">{tr({ fr: 'Fournie à l’élément', en: 'Delivered to the element' })} <b>{si(totals.inE, 'J')}</b></div>
    <div class="bar"><div class="seg in" style="width: {pct(totals.inE)}"></div></div>
    <div class="lbl">{tr({ fr: 'Rendue à la source', en: 'Given back to the source' })} <b>{si(totals.outE, 'J')}</b></div>
    <div class="bar"><div class="seg out" style="width: {pct(totals.outE)}"></div></div>
    <div class="lbl">{tr({ fr: 'Bilan net', en: 'Net' })} <b>{si(totals.inE - totals.outE, 'J')}</b></div>
    <p class="note">
      {tr({
        fr: 'Une bobine ou un condensateur rend toute l’énergie reçue à chaque période : ils la stockent puis la restituent. Une résistance ne rend jamais rien.',
        en: 'An inductor or a capacitor gives back everything it received, every period: it stores energy, then returns it. A resistor never gives anything back.',
      })}
    </p>
  </div>
</section>

<style>
  .lbl {
    font-size: 12px;
    color: var(--muted);
    margin-top: 4px;
  }
  .lbl b {
    color: var(--ink);
    font-family: var(--mono);
    font-weight: 500;
  }
  .bar {
    height: 16px;
    background: var(--panel-2);
    border: 1px solid var(--line);
    border-radius: 5px;
    overflow: hidden;
    margin: 3px 0 6px;
  }
  .seg {
    height: 100%;
  }
  .in {
    background: var(--c-p);
  }
  .out {
    background: var(--warn);
  }
  .note {
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }
</style>
