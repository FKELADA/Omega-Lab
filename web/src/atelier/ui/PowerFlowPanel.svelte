<script lang="ts">
  // Power flow of the bench's three-phase grid (Newton–Raphson, positive
  // sequence), next to the sinusoidal steady state of the same drawing.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { benchPowerFlow } from '../powerflow';
  import { useBench } from './context';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import { si } from '../library';

  let { lab }: { lab: Lab } = $props();
  const bench = useBench();
  const pf = $derived(benchPowerFlow(bench.compiled.net, lab.params));
  const f = (v: number, d = 3) => num(v, d);
  /** Solver residue (1e-11 MW) shown as 0. */
  const clean = (v: number) => (Math.abs(v) < 1e-6 ? 0 : v);
</script>

<section class="panel pf">
  <header>
    <span>{tr({ fr: 'Répartition de charge', en: 'Power flow' })}</span>
    <span class="spacer"></span>
    {#if pf.ok}<span class="n">{pf.iterations} {tr({ fr: 'itérations', en: 'iterations' })} · {tr({ fr: 'pertes', en: 'losses' })} {f(pf.losses)} MW</span>{/if}
  </header>
  <div class="body">
    {#if pf.message === 'none'}
      <p class="msg">{tr({ fr: 'La répartition de charge porte sur les réseaux triphasés : placez des éléments de la famille « Réseau triphasé ».', en: 'The power flow applies to three-phase grids: place elements of the “Three-phase grid” family.' })}</p>
    {:else if pf.message === 'noslack'}
      <p class="msg">{tr({ fr: 'Il faut une source triphasée (nœud bilan) ou un alternateur.', en: 'A three-phase source (slack bus) or a generator is needed.' })}</p>
    {:else}
      {#if !pf.ok}<p class="msg warn">{tr({ fr: 'Newton–Raphson ne converge pas : au-delà du nez, il n’existe pas d’état d’équilibre (leçon 5.2).', en: 'Newton–Raphson does not converge: beyond the nose there is no equilibrium (lesson 5.2).' })}</p>{/if}
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>{tr({ fr: 'Nœud', en: 'Bus' })}</th><th>{tr({ fr: 'type', en: 'type' })}</th><th>U<sub>n</sub></th><th>V (pu)</th><th>θ</th>
              <th>P<sub>g</sub> / Q<sub>g</sub></th><th>P<sub>d</sub> / Q<sub>d</sub></th><th title={tr({ fr: 'régime établi, charges à impédance constante', en: 'steady state, constant-impedance loads' })}>V<sub>RE</sub></th>
            </tr>
          </thead>
          <tbody>
            {#each pf.buses as b (b.name)}
              <tr class:low={b.V < 0.95} class:high={b.V > 1.05}>
                <td>{b.name}</td>
                <td class="t">{b.type === 'slack' ? tr({ fr: 'bilan', en: 'slack' }) : b.type.toUpperCase()}</td>
                <td class="m">{si(b.Vbase, 'V')}</td>
                <td class="m v">{f(b.V, 4)}</td>
                <td class="m">{f(b.th, 3)}°</td>
                <td class="m">{Math.abs(b.Pg) + Math.abs(b.Qg) > 1e-6 ? `${f(clean(b.Pg))} / ${f(clean(b.Qg))}` : ''}</td>
                <td class="m">{Math.abs(b.Pd) + Math.abs(b.Qd) > 1e-6 ? `${f(clean(b.Pd))} / ${f(clean(b.Qd))}` : ''}</td>
                <td class="m">{b.Vss !== null ? f(b.Vss, 4) : ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <table>
          <thead><tr><th>{tr({ fr: 'Branche', en: 'Branch' })}</th><th>{tr({ fr: 'de → vers', en: 'from → to' })}</th><th>P (MW)</th><th>Q (Mvar)</th><th>{tr({ fr: 'pertes', en: 'losses' })}</th></tr></thead>
          <tbody>
            {#each pf.lines as l, k (k)}
              <tr><td>{l.name}</td><td>{l.from} → {l.to}</td><td class="m">{f(l.P)}</td><td class="m">{f(l.Q)}</td><td class="m">{f(l.loss)}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="note">
        {tr({
          fr: 'Newton–Raphson sur le schéma direct, base 100 MVA ; puissances en MW et Mvar. Les charges y sont à puissance constante ; dans la simulation (colonne V_RE, régime établi), elles sont à impédance constante : l’écart montre l’effet de ce choix de modèle.',
          en: 'Newton–Raphson on the positive-sequence network, 100 MVA base; powers in MW and Mvar. Loads are constant-power here; in the simulation (V_RE column, steady state) they are constant-impedance: the gap shows the effect of that modelling choice.',
        })}
      </p>
    {/if}
  </div>
</section>

<style>
  .n {
    color: var(--muted);
    font-family: var(--mono);
    text-transform: none;
  }
  .scroll {
    max-height: 260px;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
    margin-bottom: 8px;
  }
  th {
    text-align: left;
    color: var(--muted);
    font-weight: 600;
    border-bottom: 1px solid var(--line);
    padding: 2px 4px;
    position: sticky;
    top: 0;
    background: var(--panel);
  }
  td {
    padding: 2px 4px;
    border-bottom: 1px solid var(--line);
    white-space: nowrap;
  }
  .m {
    font-family: var(--mono);
  }
  .t {
    color: var(--muted);
  }
  tr.low .v,
  tr.high .v {
    color: var(--warn);
    font-weight: 700;
  }
  .msg,
  .note {
    color: var(--muted);
    font-size: 12px;
  }
  .warn {
    color: var(--warn);
  }
</style>
