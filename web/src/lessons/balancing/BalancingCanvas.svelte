<script lang="ts">
  // Two control areas (France and the rest of continental Europe), the interchange between
  // them, the plant that trips, and France's three reserves at the time cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { AREA, BAL } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const tripped = $derived(lab.t >= BAL.tInc);
  const fr = $derived(lab.params.area === AREA.fr);
  const tie = $derived(lab.at('tie'));
  const bars = $derived([
    { id: 'fcr', label: 'FCR', v: lab.at('fcr'), max: BAL.fcr[0], c: '--c-p' },
    { id: 'afrr', label: 'aFRR', v: lab.at('afrr'), max: BAL.afrr[0], c: '--c-L' },
    { id: 'mfrr', label: 'mFRR', v: lab.at('mfrr'), max: 3000, c: '--c-C' },
  ]);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 230" role="img" aria-label="Two control areas">
      <rect x="20" y="20" width="140" height="110" rx="10" class="box" />
      <text x="90" y="40" class="v">{tr({ fr: 'France', en: 'France' })}</text>
      <rect x="240" y="20" width="140" height="110" rx="10" class="box" />
      <text x="310" y="40" class="v">{tr({ fr: 'Europe continentale', en: 'Continental Europe' })}</text>
      <!-- the plant that trips -->
      <g transform="translate({fr ? 90 : 310},80)">
        <circle r="16" class="src" class:dim={tripped} />
        <path d="M-9,0 c3,-8 5,-8 9,0 s5,8 9,0" class="sym" />
        {#if tripped}<text y="34" class="small bad">−{num(lab.params.inc, 4)} MW</text>{/if}
      </g>
      <!-- interchange -->
      <line x1="160" y1="75" x2="240" y2="75" class="flow" />
      {#if Math.abs(tie) > 5}
        {#if tie < 0}
          <path d="M168,75 l12,-7 v14 z" class="arrow" />
        {:else}
          <path d="M232,75 l-12,-7 v14 z" class="arrow" />
        {/if}
      {/if}
      <text x="200" y="66" class="v">{num(Math.abs(tie), 3)} MW</text>
      <text x="200" y="96" class="small">{tie < -5 ? tr({ fr: 'la France importe', en: 'France imports' }) : tie > 5 ? tr({ fr: 'la France exporte', en: 'France exports' }) : ''}</text>
      <text x="200" y="120" class="big">{lab.concealed ? 'f = ?' : `${num(lab.at('f'), 5)} Hz`}</text>
      <!-- France's reserves -->
      {#each bars as b, i (b.id)}
        <g transform="translate(30,{150 + i * 24})">
          <text x="20" y="12" class="small">{b.label}</text>
          <rect x="50" y="2" width="240" height="12" rx="3" class="track" />
          <rect x="50" y="2" width={Math.max(0, Math.min(1, b.v / b.max)) * 240} height="12" rx="3" style="fill: var({b.c})" />
          <text x="330" y="12" class="v">{num(b.v, 3)} MW</text>
        </g>
      {/each}
    </svg>
  </div>
</section>
