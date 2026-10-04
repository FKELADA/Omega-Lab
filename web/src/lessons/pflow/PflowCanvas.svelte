<script lang="ts">
  // The network as seen by Newton–Raphson at the iteration under the cursor:
  // from the flat start, voltages and flows settle as the learner scrubs.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { branchFlows, injections } from '../../lib/core/powerflow';
  import { iterateAt, network, OUTAGES, type PflowInfo } from '../../lib/models/module5';
  import GridCanvas from './GridCanvas.svelte';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PflowInfo);
  const it = $derived(iterateAt(k, lab.t));
  const kIt = $derived(Math.min(k.nr.history.length - 1, Math.floor(lab.t + 1e-9)));
  const net = $derived(network(lab.params));
  const flows = $derived(branchFlows(net.branches, it.V, it.th));
  const Qg = $derived(injections(k.Y, it.V, it.th).Q.map((q, i) => q + net.buses[i].Qd));
  const status = $derived(
    !k.nr.converged
      ? { fr: 'ne converge pas', en: 'does not converge' }
      : kIt >= k.nr.iterations
        ? { fr: `convergé en ${k.nr.iterations} itérations`, en: `converged in ${k.nr.iterations} iterations` }
        : { fr: `itération ${kIt}`, en: `iteration ${kIt}` },
  );
</script>

<GridCanvas
  {lab}
  title={{ fr: 'Réseau à 4 nœuds', en: 'Four-bus network' }}
  {status}
  bad={!k.nr.converged}
  V={it.V}
  th={it.th}
  {flows}
  {Qg}
  types={net.buses.map((b) => b.type)}
  out={OUTAGES[lab.params.out]}
  loads={[net.buses[2].Pd, net.buses[3].Pd]}
/>
