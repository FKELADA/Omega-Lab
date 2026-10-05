<script lang="ts">
  // The oscillatory modes of the chosen network (G2ELin's full model), one row
  // each: frequency, damping, nature and the units that take part most. Click a
  // row to study that mode.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { CATEGORY, CATEGORY_COLOR, unitLabel, type ModesInfo } from '../../lib/models/g2data';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ModesInfo);
  // Remember which networks were opened (a step compares two of them).
  $effect(() => {
    lab.flags[`net_${k.id}`] = true;
  });
  const topUnits = (u: Record<string, number>) =>
    Object.entries(u)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, v]) => `${unitLabel(n)} ${Math.round(100 * v)} %`)
      .join(' · ');
</script>

<section class="panel">
  <header>
    <span>{tr(k.net.name)}</span>
    <span class="spacer"></span>
    <span class="n">{k.net.nStates} {tr({ fr: 'états', en: 'states' })}</span>
  </header>
  <div class="body">
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>f</th>
            <th>ζ</th>
            <th>{tr({ fr: 'nature', en: 'nature' })}</th>
            <th>{tr({ fr: 'unités dominantes', en: 'main units' })}</th>
          </tr>
        </thead>
        <tbody>
          {#each k.modes as m, j (m.mode)}
            <tr class:sel={j === k.index} onclick={() => lab.setParam('mode', j + 1)}>
              <td>{j + 1}</td>
              <td class="mono">{num(m.f, 3)} Hz</td>
              <td class="mono" class:low={m.zeta < 5} class:neg={m.zeta < 0}>{num(m.zeta, 3)} %</td>
              <td><i style="background: var({CATEGORY_COLOR[m.category] ?? '--muted'})"></i>{tr(CATEGORY[m.category] ?? { fr: m.category, en: m.category })}</td>
              <td class="units">{topUnits(m.units)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="note">{tr({ fr: 'Cliquez sur un mode. Calcul G2ELin sur le modèle complet, pré-calculé.', en: 'Click a mode. G2ELin computation on the full model, precomputed.' })}</p>
  </div>
</section>

<style>
  .n {
    color: var(--muted);
    font-family: var(--mono);
    text-transform: none;
  }
  .scroll {
    max-height: 210px;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
  }
  th {
    position: sticky;
    top: 0;
    background: var(--panel);
    color: var(--muted);
    font-weight: 600;
    text-align: left;
    padding: 3px 4px;
    border-bottom: 1px solid var(--line);
  }
  td {
    padding: 4px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  tr {
    cursor: pointer;
  }
  tbody tr:hover {
    background: var(--panel-2);
  }
  tr.sel {
    background: var(--accent-soft);
  }
  .mono {
    font-family: var(--mono);
  }
  .low {
    color: var(--warn);
    font-weight: 700;
  }
  .neg {
    color: var(--warn);
    text-decoration: underline;
  }
  i {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
  }
  .units {
    color: var(--muted);
    white-space: normal;
  }
  .note {
    margin: 6px 0 0;
    font-size: 11px;
    color: var(--muted);
  }
</style>
