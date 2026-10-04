<script lang="ts">
  // Measured step-response figures against the design target.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { PzInfo } from '../../lib/models/module3';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';
  import { SPEC } from './spec';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PzInfo);
  const rows = $derived([
    {
      name: { fr: 'Dépassement', en: 'Overshoot' },
      value: k.stable ? `${num(100 * k.os, 3)} %` : '—',
      theory: k.osTheory ? `${num(100 * k.osTheory, 3)} %` : '0 %',
      target: `≤ ${SPEC.os * 100} %`,
      ok: k.stable && k.os <= SPEC.os,
    },
    {
      name: { fr: 'Temps de réponse à 2 %', en: '2 % settling time' },
      value: k.stable ? si(k.ts, 's') : '∞',
      theory: k.stable ? si(k.tsTheory, 's') : '∞',
      target: `≤ ${si(SPEC.ts, 's')}`,
      ok: k.stable && k.ts <= SPEC.ts,
    },
    {
      name: { fr: 'Contre-réaction initiale', en: 'Initial undershoot' },
      value: `${num(100 * k.us, 3)} %`,
      theory: '—',
      target: '—',
      ok: null,
    },
  ]);
  const met = $derived(rows[0].ok && rows[1].ok);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Performances', en: 'Performance' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>{tr({ fr: 'mesuré', en: 'measured' })}</th>
          <th>{tr({ fr: 'formule', en: 'formula' })}</th>
          <th>{tr({ fr: 'objectif', en: 'target' })}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.name.en)}
          <tr class:ok={r.ok === true} class:ko={r.ok === false}>
            <td>{tr(r.name)}</td>
            <td>{r.value}</td>
            <td>{r.theory}</td>
            <td>{r.target}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="verdict" class:met>
      {#if !k.stable}
        {tr({ fr: 'Instable : un pôle est dans le demi-plan droit.', en: 'Unstable: a pole is in the right half-plane.' })}
      {:else if met}
        ✓ {tr({ fr: 'Objectif atteint', en: 'Target met' })}
      {:else}
        {tr({ fr: 'Objectif non atteint : amenez les pôles dans la zone verte.', en: 'Target not met: move the poles into the green region.' })}
      {/if}
    </div>
  </div>
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }
  th {
    text-align: right;
    color: var(--muted);
    font-weight: 600;
    padding: 3px 6px;
    border-bottom: 1px solid var(--line);
  }
  td {
    text-align: right;
    font-family: var(--mono);
    padding: 4px 6px;
    border-bottom: 1px solid var(--line);
  }
  td:first-child {
    text-align: left;
    font-family: var(--font);
  }
  tr.ok td:nth-child(2) {
    color: var(--good);
    font-weight: 700;
  }
  tr.ko td:nth-child(2) {
    color: var(--warn);
    font-weight: 700;
  }
  .verdict {
    margin-top: 10px;
    padding: 6px 10px;
    border-radius: 6px;
    background: var(--warn-soft);
    font-size: 13px;
  }
  .verdict.met {
    background: var(--good-soft);
    color: var(--good);
    font-weight: 600;
  }
</style>
