<script lang="ts">
  // The chain from the primary substation to the last LV customer, with the voltage at each
  // point at the cursor hour, the PV on the feeder and the direction of the flow.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { DVP, dvpAt, type DvpInfo } from '../../lib/models/module10';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as DvpInfo);
  const s = $derived(dvpAt(lab.params, lab.t));
  const bad = (v: number, lim: number[]) => v < lim[0] || v > lim[1];
  const rev = $derived(s.Pnet < 0);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if !k.ok}<span class="kit-warn">{tr({ fr: 'hors plage sur la journée', en: 'out of range during the day' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 200" role="img" aria-label="Voltage plan">
      <!-- primary substation with tap changer -->
      <circle cx="40" cy="80" r="14" class="coil" />
      <circle cx="54" cy="80" r="14" class="coil2" />
      <line x1="30" y1="100" x2="64" y2="60" class="w" />
      <text x="47" y="114" class="small">HTB/HTA</text>
      <line x1="68" y1="80" x2="250" y2="80" class={rev ? 'flow' : 'w'} />
      {#if rev}<path d="M90,80 l10,-6 v12 z" class="arrow" />{/if}
      <!-- PV on the feeder -->
      <rect x="150" y="40" width="30" height="16" rx="2" class="box" class:dim={lab.params.pv < 0.5} />
      <text x="165" y="52" class="small">PV</text>
      <line x1="165" y1="56" x2="165" y2="80" class="thin" />
      <text x="165" y="32" class="small">{num(s.Ppv, 3)} MW</text>
      <!-- MV/LV transformer and LV feeder -->
      <circle cx="260" cy="80" r="10" class="coil" />
      <circle cx="270" cy="80" r="10" class="coil2" />
      <text x="265" y="104" class="small">HTA/BT {lab.params.tap > 0 ? '+' : ''}{num(lab.params.tap, 2)} %</text>
      <line x1="280" y1="80" x2="370" y2="80" class="w" />
      <path d="M370,80 v14 m-6,-6 l6,8 l6,-8" class="load" />
      <!-- voltages -->
      <text x="54" y="140" class="v">{num(s.Vbus, 4)} %</text>
      <text x="245" y="140" class="v" class:bad={bad(s.farMV, DVP.limitsMV)}>{num(s.farMV, 4)} %</text>
      <text x="370" y="140" class="v" class:bad={bad(s.lvEnd, DVP.limitsLV)}>{num(s.lvEnd, 4)} %</text>
      <text x="54" y="156" class="small">{tr({ fr: 'poste source', en: 'substation' })}</text>
      <text x="245" y="156" class="small">{tr({ fr: 'bout HTA', en: 'MV end' })}</text>
      <text x="370" y="156" class="small">{tr({ fr: 'dernier client', en: 'last customer' })}</text>
      <text x="200" y="186" class="small">{rev ? tr({ fr: 'le départ injecte vers le poste source', en: 'the feeder exports to the substation' }) : tr({ fr: 'le départ soutire', en: 'the feeder draws power' })} · P<tspan baseline-shift="sub" font-size="8">net</tspan> = {num(s.Pnet, 3)} MW</text>
    </svg>
  </div>
</section>
