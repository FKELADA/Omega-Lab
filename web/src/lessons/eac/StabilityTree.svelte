<script lang="ts">
  // The IEEE/CIGRE 2020 classification of power-system stability. Each leaf
  // opens the lesson that explores it; the current lesson's leaf is highlighted.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { tr, type L } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  interface Leaf {
    name: L;
    lesson: string;
    x: number;
    y: number;
  }
  interface Branch {
    name: L;
    x: number;
    leaves: Leaf[];
  }
  const branches: Branch[] = [
    { name: { fr: 'Angle rotorique', en: 'Rotor angle' }, x: 50, leaves: [
      { name: { fr: 'petits signaux', en: 'small-signal' }, lesson: '8.2', x: 26, y: 132 },
      { name: { fr: 'transitoire', en: 'transient' }, lesson: '8.1', x: 74, y: 154 },
    ] },
    { name: { fr: 'Tension', en: 'Voltage' }, x: 130, leaves: [{ name: { fr: 'long terme', en: 'long term' }, lesson: '8.3', x: 130, y: 132 }] },
    { name: { fr: 'Fréquence', en: 'Frequency' }, x: 196, leaves: [{ name: { fr: 'court/long terme', en: 'short/long term' }, lesson: '8.4', x: 196, y: 132 }] },
    { name: { fr: 'Convertisseurs', en: 'Converter-driven' }, x: 260, leaves: [{ name: { fr: 'lente/rapide', en: 'slow/fast' }, lesson: '8.5', x: 260, y: 132 }] },
    { name: { fr: 'Résonance', en: 'Resonance' }, x: 324, leaves: [{ name: { fr: 'RSS, SSCI', en: 'SSR, SSCI' }, lesson: '8.6', x: 324, y: 132 }] },
  ];
  const here = $derived(location.hash.replace('#', '') || '8.1');
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Classification IEEE/CIGRE 2020', en: 'IEEE/CIGRE 2020 classification' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 360 190" text-anchor="middle" role="img" aria-label="Stability classification">
      <rect x="110" y="8" width="140" height="26" rx="6" class="root" />
      <text x="180" y="25" class="rt">{tr({ fr: 'Stabilité du réseau', en: 'Power-system stability' })}</text>
      {#each branches as b (b.x)}
        <path d="M180,34 V48 H{b.x} V62" class="edge" />
        <rect x={b.x - 31} y="62" width="62" height="34" rx="5" class="br" />
        <text x={b.x} y="83" class="bt">{tr(b.name)}</text>
        {#each b.leaves as l (l.lesson)}
          <path d="M{b.x},96 V{l.y - 14} H{l.x} V{l.y - 8}" class="edge" />
          <a href="#{l.lesson}" aria-label={tr(l.name)}>
            <rect x={l.x - 28} y={l.y - 8} width="56" height="20" rx="10" class="leaf" class:here={here === l.lesson} />
            <text x={l.x} y={l.y + 5} class="lt" class:here={here === l.lesson}>{tr(l.name)}</text>
          </a>
        {/each}
      {/each}
      <a href="#8.7" aria-label="G2ELin">
        <rect x="110" y="166" width="140" height="20" rx="10" class="leaf g2" class:here={here === '8.7'} />
        <text x="180" y="180" class="lt">{tr({ fr: 'Réseaux réels avec G2ELin', en: 'Real networks with G2ELin' })}</text>
      </a>
    </svg>
    <p class="note">{tr({ fr: 'Cliquez sur une feuille pour ouvrir sa leçon.', en: 'Click a leaf to open its lesson.' })}</p>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .root {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-width: 1.5;
  }
  .rt {
    fill: var(--accent);
    font-size: 11px;
    font-weight: 700;
  }
  .br {
    fill: var(--panel-2);
    stroke: var(--muted);
  }
  .bt {
    fill: var(--ink);
    font-size: 8.5px;
    font-weight: 600;
  }
  .edge {
    fill: none;
    stroke: var(--line);
    stroke-width: 1.5;
  }
  .leaf {
    fill: var(--panel);
    stroke: var(--c-p);
    stroke-width: 1.2;
    cursor: pointer;
  }
  .leaf.here {
    fill: var(--c-p);
  }
  .leaf.g2 {
    stroke: var(--c-S);
  }
  .lt {
    fill: var(--c-p);
    font-size: 8.5px;
    cursor: pointer;
  }
  .lt.here {
    fill: var(--panel);
    font-weight: 700;
  }
  .note {
    margin: 4px 0 0;
    font-size: 11.5px;
    color: var(--muted);
  }
</style>
