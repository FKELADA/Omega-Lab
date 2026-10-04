<script lang="ts">
  // Base quantities in each voltage zone: one power base, three voltage bases.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { PerUnitInfo } from '../../lib/models/module2b';
  import { tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PerUnitInfo);
  const colors = ['--c-a', '--c-n', '--c-vs'];
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Bases par zone', en: 'Bases per zone' })}</span></header>
  <div class="body">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>V<sub>base</sub></th>
          <th>I<sub>base</sub></th>
          <th>Z<sub>base</sub></th>
        </tr>
      </thead>
      <tbody>
        {#each k.zones as z, j (j)}
          <tr style="--c: var({colors[j]})">
            <td><i></i>{tr({ fr: 'Zone', en: 'Zone' })} {j + 1}</td>
            <td>{si(z.Vb, 'V')}</td>
            <td>{si(z.Ib, 'A')}</td>
            <td>{si(z.Zb, 'Ω')}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="note">
      {tr({
        fr: 'Une seule puissance de base pour tout le réseau. La tension de base suit les rapports des transformateurs, si bien que les transformateurs idéaux disparaissent du schéma en pu.',
        en: 'One power base for the whole network. The voltage base follows the transformer ratios, so ideal transformers vanish from the pu diagram.',
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
  th {
    text-align: right;
    font-weight: 600;
    color: var(--muted);
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
    font-weight: 600;
    color: var(--c);
  }
  td i {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 2px;
    background: var(--c);
    margin-right: 6px;
  }
  .note {
    font-size: 12px;
    color: var(--muted);
    margin: 8px 0 0;
  }
</style>
