<script lang="ts">
  // The six shedding stages as feeders that open one after the other, a frequency dial with
  // the 47.5 and 51.5 Hz limits, and the state of the system.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { DEF, type DefInfo } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as DefInfo);
  const f = $derived(lab.at('f'));
  const dark = $derived(!isFinite(f) || isNaN(f));
  const opened = $derived(lab.params.step > 0 ? Math.round(lab.at('shed') / lab.params.step) : 0);
  const fy = (v: number) => 200 - ((v - 47) / 5) * 170;
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if !lab.concealed && k.blackout}<span class="kit-warn">{tr({ fr: 'panne généralisée', en: 'blackout' })}</span>
    {:else if !lab.concealed && k.over}<span class="kit-warn">{tr({ fr: 'sur-délestage', en: 'over-shedding' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 230" role="img" aria-label="Load shedding stages">
      <line x1="40" y1="30" x2="40" y2="200" class="bus" />
      <text x="40" y="20" class="small">{tr({ fr: 'poste', en: 'substation' })}</text>
      {#each Array.from({ length: DEF.stages }, (_, i) => i) as s (s)}
        {@const y = 40 + s * 28}
        {@const open = s < opened && !dark}
        <line x1="40" y1={y} x2="70" y2={y} class="w" />
        <line x1="70" y1={y} x2={open ? 84 : 90} y2={open ? y - 10 : y} class={open ? 'open' : 'closed'} />
        <line x1="90" y1={y} x2="130" y2={y} class="w" class:dim={open || dark} />
        <path d="M130,{y} v10 m-6,-5 l6,8 l6,-8" class="load" class:dim={open || dark} />
        <text x="180" y={y + 4} class="small">{num(lab.params.f1 - s * DEF.gap, 3)} Hz · {num(lab.params.step, 2)} %</text>
      {/each}
      <!-- frequency dial -->
      <g transform="translate(300,0)">
        <rect x="0" y={fy(52)} width="24" height={fy(47) - fy(52)} rx="3" class="track" />
        <rect x="0" y={fy(51.5)} width="24" height={fy(47.5) - fy(51.5)} class="band" />
        {#if !dark}<line x1="-6" y1={fy(Math.max(47, Math.min(52, f)))} x2="30" y2={fy(Math.max(47, Math.min(52, f)))} class="w hot" />{/if}
        <text x="12" y="20" class="v">{lab.concealed ? '?' : dark ? '—' : `${num(f, 4)} Hz`}</text>
        <text x="48" y={fy(51.5) + 4} class="small">51,5</text>
        <text x="48" y={fy(50) + 4} class="small">50</text>
        <text x="48" y={fy(47.5) + 4} class="small">47,5</text>
      </g>
      <text x="200" y="222" class="small">RoCoF ≈ {num(k.rocof, 3)} Hz/s · H = {num(lab.params.H, 2)} s</text>
    </svg>
  </div>
</section>
