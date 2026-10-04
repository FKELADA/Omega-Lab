<script lang="ts">
  // The four-bus network at the loading under the cursor (the cursor is λ here).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { network, OUTAGES, pvAt, type PvLessonInfo } from '../../lib/models/module5';
  import { num } from '../../lib/ui/format';
  import GridCanvas from '../pflow/GridCanvas.svelte';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PvLessonInfo);
  const pt = $derived(pvAt(k, lab.t));
  const net = $derived(network(lab.params, pt.lambda));
  const status = $derived(
    pt.ok
      ? pt.limited
        ? { fr: `G2 en butée de réactif · λ = ${num(pt.lambda, 3)}`, en: `G2 at its reactive limit · λ = ${num(pt.lambda, 3)}` }
        : { fr: `λ = ${num(pt.lambda, 3)} · nez à ${num(k.lambdaMax, 3)}`, en: `λ = ${num(pt.lambda, 3)} · nose at ${num(k.lambdaMax, 3)}` }
      : { fr: 'au-delà du nez : effondrement', en: 'beyond the nose: collapse' },
  );
</script>

<GridCanvas
  {lab}
  title={{ fr: 'Réseau à 4 nœuds', en: 'Four-bus network' }}
  {status}
  bad={!pt.ok || pt.limited}
  V={pt.V}
  th={pt.th}
  flows={pt.flows}
  Qg={pt.Qg}
  types={net.buses.map((b, i) => (i === 1 && pt.limited ? 'pq' : b.type))}
  qLimited={[false, pt.limited, false, false]}
  out={OUTAGES[lab.params.out]}
  loads={[net.buses[2].Pd, net.buses[3].Pd]}
  B4={lab.params.B4}
/>
