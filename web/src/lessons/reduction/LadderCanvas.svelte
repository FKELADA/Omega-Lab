<script lang="ts">
  // The ladder of model levels, from full EMT down to the classical machine:
  // what each level removes, how many states remain, how long G2ELin takes to
  // simulate it, and what happens to Kundur's inter-area mode. Click a row.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { emModes, REDUCTION, type ReductionInfo } from '../../lib/models/g2data';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import { REMOVED } from './levels';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ReductionInfo);
  // Remember which levels were visited (a step goes through two of them).
  $effect(() => {
    lab.flags[`lvl_${k.level}`] = true;
  });
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Du modèle EMT au modèle classique', en: 'From the EMT model to the classical one' })}</span>
  </header>
  <div class="body">
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>{tr({ fr: 'niveau', en: 'level' })}</th>
            <th title={tr({ fr: 'états SMIB / Kundur', en: 'states SMIB / Kundur' })}>{tr({ fr: 'états', en: 'states' })}</th>
            <th title={tr({ fr: 'durée de calcul G2ELin pour 3 s simulées (SMIB)', en: 'G2ELin run time for 3 s simulated (SMIB)' })}>{tr({ fr: 'calcul', en: 'run' })}</th>
            <th title={tr({ fr: 'mode inter-zones de Kundur', en: 'Kundur inter-area mode' })}>{tr({ fr: 'inter-zones', en: 'inter-area' })}</th>
          </tr>
        </thead>
        <tbody>
          {#each REDUCTION.levels as L, j (L.id)}
            {@const s = REDUCTION.smib[L.id]}
            {@const iz = emModes(REDUCTION.kundur[L.id])[0]}
            <tr class:sel={L.id === k.level} onclick={() => lab.setParam('level', j)}>
              <td>
                <b>{tr(L.name)}</b>
                <span class="rm">{tr(REMOVED[L.id])}</span>
              </td>
              <td class="mono">{s.modal.nStates} / {REDUCTION.kundur[L.id].nStates}</td>
              <td class="mono">{s.emt ? `${num(s.emt.seconds, 2)} s` : '—'}</td>
              <td class="mono" class:low={iz && iz.zeta < 5}>{iz ? `${num(iz.f, 3)} Hz · ${num(iz.zeta, 2)} %` : '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="note">
      {tr({
        fr: 'Cliquez sur un niveau. États : machine seule sur réseau infini (SMIB) / réseau de Kundur. Durées de calcul indicatives (elles dépendent aussi du pas choisi par le solveur).',
        en: 'Click a level. States: one machine on an infinite bus (SMIB) / Kundur’s network. Run times are indicative (they also depend on the solver’s step).',
      })}
    </p>
  </div>
</section>

<style>
  .scroll {
    max-height: 260px;
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
    vertical-align: top;
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
  .rm {
    display: block;
    color: var(--muted);
    font-size: 10.5px;
  }
  .mono {
    font-family: var(--mono);
    white-space: nowrap;
  }
  .low {
    color: var(--warn);
    font-weight: 700;
  }
  .note {
    margin: 6px 0 0;
    font-size: 11px;
    color: var(--muted);
  }
</style>
