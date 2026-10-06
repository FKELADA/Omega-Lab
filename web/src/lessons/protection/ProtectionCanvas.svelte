<script lang="ts">
  // The primary substation (incomer and feeder breakers), the overhead feeder with the fault,
  // and the state of each breaker at the time cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { PROT, type ProtInfo } from '../../lib/models/module10';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ProtInfo);
  const closed = $derived(lab.at('brk') > 0.5);
  const incomerOpen = $derived(k.incomer && lab.t > PROT.tFault + PROT.tIncomer);
  const faultOn = $derived(lab.t >= PROT.tFault && lab.at('i') > PROT.Iload * 1.01);
  const fx = $derived(130 + (230 * lab.params.d) / PROT.len);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.incomer}<span class="kit-warn">{tr({ fr: 'l’arrivée coupe tout le poste', en: 'the incomer trips the whole substation' })}</span>
    {:else if k.lockout}<span class="kit-warn">{tr({ fr: 'départ verrouillé', en: 'feeder locked out' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 200" role="img" aria-label="Feeder protection">
      <circle cx="30" cy="70" r="13" class="coil" />
      <circle cx="30" cy="88" r="13" class="coil2" />
      <!-- incomer -->
      <line x1="30" y1="101" x2="30" y2="112" class="w" />
      <line x1="30" y1="112" x2={incomerOpen ? 40 : 30} y2="126" class={incomerOpen ? 'open' : 'closed'} />
      <text x="62" y="122" class="small">{tr({ fr: 'arrivée', en: 'incomer' })} {PROT.tIncomer} s</text>
      <line x1="10" y1="132" x2="110" y2="132" class="bus" />
      <!-- feeder breaker and line -->
      <line x1="90" y1="132" x2="90" y2="100" class="w" />
      <line x1="90" y1="100" x2={closed ? 90 : 100} y2={closed ? 86 : 88} class={closed ? 'closed' : 'open'} />
      <line x1="90" y1="86" x2="90" y2="70" class="w" />
      <line x1="90" y1="70" x2="380" y2="70" class={faultOn ? 'w hot' : 'w'} />
      <rect x="100" y="94" width="40" height="18" rx="3" class="box" />
      <text x="120" y="107" class="small">I&gt; {num(lab.params.Is, 3)}</text>
      {#each [170, 220, 270, 320, 370] as x (x)}
        <path d="M{x},70 v12 m-5,-5 l5,7 l5,-7" class="load" class:dim={!closed || incomerOpen} />
      {/each}
      <text x={fx} y="58" class="small bad">⚡ {num(lab.params.d, 3)} km</text>
      <text x="235" y="118" class="v">I = {num(lab.at('i'), 4)} A</text>
      <text x="235" y="140" class="small">{tr({ fr: 'défaut biphasé', en: 'phase-to-phase fault' })} : {num(k.Ifault, 4)} A</text>
      <text x="200" y="176" class="small">
        {k.sees ? tr({ fr: 'le départ voit le défaut', en: 'the feeder sees the fault' }) : tr({ fr: 'le départ ne voit pas le défaut', en: 'the feeder does not see the fault' })} · {tr({ fr: 'fenêtre', en: 'window' })} {num(k.isMin, 3)}–{num(k.isMax, 3)} A
      </text>
      <text x="200" y="194" class="small">{lab.params.reclose ? tr({ fr: 'cycle : réenclenchement rapide (0,3 s) puis lent (15 s)', en: 'cycle: rapid (0.3 s) then slow (15 s) reclosure' }) : tr({ fr: 'pas de réenclenchement', en: 'no reclosing' })}</text>
    </svg>
  </div>
</section>
