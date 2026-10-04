<script lang="ts">
  // The same line, three models: how far are the short and nominal-π models from
  // the exact distributed solution at this length and load?
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import type { LineInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num, si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LineInfo);
  const Vph = $derived((lab.params.kV * 1e3) / Math.sqrt(3));
  const names = [
    { fr: 'Ligne courte (R + jX)', en: 'Short line (R + jX)' },
    { fr: 'π nominal', en: 'Nominal π' },
    { fr: 'Exact (réparti)', en: 'Exact (distributed)' },
  ];
  const rows = $derived(
    k.all.map((s, j) => {
      const v = cabs(s.Vr) / Vph;
      const err = (cabs(s.Vr) - cabs(k.exact.Vr)) / cabs(k.exact.Vr);
      return { j, v, err, Is: cabs(s.Is) };
    }),
  );
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Trois modèles', en: 'Three models' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>|V<sub>r</sub>|</th>
          <th>{tr({ fr: 'écart', en: 'error' })}</th>
          <th>|I<sub>s</sub>|</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r (r.j)}
          <tr class:cur={r.j === lab.params.model}>
            <td>{tr(names[r.j])}</td>
            <td>{num(r.v, 4)} pu</td>
            <td class:bad={Math.abs(r.err) > 0.01}>{r.j === 2 ? '—' : `${r.err >= 0 ? '+' : ''}${num(100 * r.err, 3)} %`}</td>
            <td>{si(r.Is, 'A')}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="note">
      {tr({
        fr: 'À vide, le courant d’entrée n’est que le courant de charge de la ligne : le modèle « ligne courte », sans capacité, l’ignore complètement.',
        en: 'At no load the sending current is just the line’s charging current: the “short line” model, with no capacitance, misses it entirely.',
      })}
    </p>
  </div>
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }
  th,
  td {
    padding: 4px 6px;
    border-bottom: 1px solid var(--line);
    text-align: right;
  }
  th {
    color: var(--muted);
    font-weight: 600;
  }
  td {
    font-family: var(--mono);
  }
  td:first-child {
    text-align: left;
    font-family: var(--font);
  }
  tr.cur {
    background: var(--accent-soft);
    font-weight: 700;
  }
  td.bad {
    color: var(--warn);
  }
  .note {
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }
</style>
