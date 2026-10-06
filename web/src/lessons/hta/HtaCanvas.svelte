<script lang="ts">
  // The loop unrolled between the two primary substations: MV/LV substations coloured by the
  // source that feeds them, the open point, and the faulty section with its open switches.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { LOOP, type LoopInfo } from '../../lib/models/module10';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LoopInfo);
  const n = LOOP.sections;
  const x = (j: number) => 40 + (320 * j) / n;
  const open = $derived(Math.round(lab.params.open));
  const fault = $derived(Math.round(lab.params.fault));
  const rescue = $derived(lab.params.rescue === 1 && fault >= 0);
  const col = (f: number) => (f === 0 ? 'var(--c-a)' : f === 1 ? 'var(--c-C)' : 'var(--warn)');
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if k.lost > 0}<span class="kit-warn">{k.lost} {tr({ fr: 'postes coupés', en: 'substations off' })}</span>
    {:else if !k.ok}<span class="kit-warn">{tr({ fr: 'limite dépassée', en: 'limit exceeded' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 200" role="img" aria-label="MV loop">
      <!-- the two primary substations -->
      <rect x="6" y="70" width="28" height="40" rx="4" class="box" />
      <text x="20" y="64" class="v">A</text>
      <rect x="366" y="70" width="28" height="40" rx="4" class="box" />
      <text x="380" y="64" class="v">B</text>
      {#each Array.from({ length: n }, (_, j) => j) as j (j)}
        {@const isOpen = j === open && !rescue}
        {@const isFault = j === fault}
        <line x1={x(j)} y1="90" x2={x(j + 1)} y2="90" class={isFault ? 'w hot' : 'w'} stroke-dasharray={isOpen ? '4 4' : undefined} />
        {#if isOpen}
          <text x={(x(j) + x(j + 1)) / 2} y="80" class="small">◇</text>
        {/if}
        {#if isFault}
          <text x={(x(j) + x(j + 1)) / 2} y="78" class="small bad">⚡</text>
          <text x={x(j) + 2} y="104" class="small">|</text>
          <text x={x(j + 1) - 2} y="104" class="small">|</text>
        {/if}
      {/each}
      {#each Array.from({ length: n - 1 }, (_, j) => j + 1) as m (m)}
        <rect x={x(m) - 4} y="110" width="8" height="8" rx="1" style="fill: {col(k.feed[m])}" />
        <line x1={x(m)} y1="90" x2={x(m)} y2="110" class="thin" />
      {/each}
      <text x="200" y="140" class="small">{tr({ fr: 'postes HTA/BT colorés selon le poste source qui les alimente', en: 'MV/LV substations coloured by the primary substation feeding them' })}</text>
      <text x="200" y="166" class="v">ΔV<tspan baseline-shift="sub" font-size="8">max</tspan> = {num(k.worstDv, 3)} % · I<tspan baseline-shift="sub" font-size="8">max</tspan> = {num(k.worstI, 3)} A / {k.Imax} A</text>
      <text x="200" y="186" class="small">{LOOP.sections} × {LOOP.len} km · {rescue ? tr({ fr: 'point d’ouverture fermé (secours)', en: 'open point closed (back-feed)' }) : tr({ fr: '◇ point d’ouverture', en: '◇ open point' })}</text>
    </svg>
  </div>
</section>
