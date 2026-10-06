<script lang="ts">
  // Kundur's two-area system: G1, G2 in area 1, G3, G4 in area 2, the long tie between them,
  // a PSS badge on each equipped machine, and each machine's speed deviation at the cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { PssInfo } from '../../lib/models/g2data-b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PssInfo);
  const PLACE_UNITS: Record<string, number[]> = { none: [], G1: [1], G2: [2], G3: [3], G4: [4], G1G3: [1, 3], all: [1, 2, 3, 4] };
  const on = $derived(PLACE_UNITS[k.place] ?? []);
  const gens = [
    { u: 1, x: 40, y: 60 },
    { u: 2, x: 40, y: 150 },
    { u: 3, x: 360, y: 60 },
    { u: 4, x: 360, y: 150 },
  ];
  const w = $derived([1, 2, 3, 4].map((u) => lab.at(`w${u}`)));
  const scale = $derived(Math.max(0.5, ...[1, 2, 3, 4].map((u) => Math.max(...Array.from(lab.run.s[`w${u}`]).map(Math.abs)))));
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if !lab.concealed && k.inter.z < 0}<span class="kit-warn">{tr({ fr: 'mode inter-zones instable', en: 'inter-area mode unstable' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 220" role="img" aria-label="Two-area system">
      <rect x="10" y="20" width="150" height="170" rx="10" class="box" />
      <rect x="240" y="20" width="150" height="170" rx="10" class="box" />
      <text x="85" y="36" class="small">{tr({ fr: 'zone 1', en: 'area 1' })}</text>
      <text x="315" y="36" class="small">{tr({ fr: 'zone 2', en: 'area 2' })}</text>
      <line x1="120" y1="105" x2="280" y2="105" class="w" />
      <line x1="120" y1="112" x2="280" y2="112" class="w" />
      <text x="200" y="98" class="small">{tr({ fr: 'liaison 220 km', en: '220 km tie' })}</text>
      {#each gens as g, i (g.u)}
        <line x1={g.x + (g.x < 200 ? 16 : -16)} y1={g.y} x2={g.x < 200 ? 120 : 280} y2="108" class="thin" />
        <circle cx={g.x} cy={g.y} r="15" class="src" />
        <text x={g.x} y={g.y + 4} class="v">G{g.u}</text>
        {#if on.includes(g.u)}
          <rect x={g.x - 16} y={g.y + 18} width="32" height="14" rx="3" class="box" style="stroke: var(--accent)" />
          <text x={g.x} y={g.y + 28} class="small" style="fill: var(--accent)">PSS</text>
        {/if}
        {#if !lab.concealed}
          <rect x={g.x < 200 ? g.x + 24 : g.x - 30} y={g.y - 4 - Math.max(0, (24 * w[i]) / scale)} width="6" height={Math.abs((24 * w[i]) / scale)} style="fill: var(--c-p)" />
        {/if}
      {/each}
      <text x="200" y="210" class="v">
        {tr({ fr: 'inter-zones', en: 'inter-area' })} {num(k.inter.f, 3)} Hz · ζ = {lab.concealed ? '?' : `${num(k.inter.z, 3)} %`} · K = {num(k.K, 3)}
      </text>
    </svg>
  </div>
</section>
