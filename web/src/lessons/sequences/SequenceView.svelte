<script lang="ts">
  // The three balanced systems hidden in any unbalanced set: positive (a→b→c),
  // negative (a→c→b) and zero (all in phase). They turn with the time cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { A, type SequenceInfo } from '../../lib/models/module2b';
  import { cabs, cmul, polar, type Complex } from '../../lib/core/linalg';
  import type { L } from '../../lib/ui/ui.svelte';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const k = $derived(lab.info as SequenceInfo);
  const spin = $derived(polar(1, k.omega * lab.t));
  const A2 = cmul(A, A);
  const sets = $derived([
    { id: '1', name: { fr: 'Directe', en: 'Positive' } as L, phasors: [k.V1, cmul(A2, k.V1), cmul(A, k.V1)] },
    { id: '2', name: { fr: 'Inverse', en: 'Negative' } as L, phasors: [k.V2, cmul(A, k.V2), cmul(A2, k.V2)] },
    { id: '0', name: { fr: 'Homopolaire', en: 'Zero' } as L, phasors: [k.V0, k.V0, k.V0] },
  ]);
  const S = 46; // pixels per pu
  const colors = ['--c-a', '--c-b', '--c-c'];
  const tipOf = (z: Complex) => {
    const r = cmul(z, spin);
    return [60 + r.re * S, 60 - r.im * S];
  };

  const presets: { label: L; p: Record<string, number> }[] = [
    { label: { fr: 'Équilibré', en: 'Balanced' }, p: { Ma: 1, Mb: 1, Ab: -120, Mc: 1, Ac: 120 } },
    { label: { fr: 'b ↔ c', en: 'b ↔ c' }, p: { Ma: 1, Mb: 1, Ab: 120, Mc: 1, Ac: -120 } },
    { label: { fr: 'Défaut phase a – terre', en: 'Phase a to ground' }, p: { Ma: 0, Mb: 1, Ab: -120, Mc: 1, Ac: 120 } },
    { label: { fr: 'Creux sur c', en: 'Dip on c' }, p: { Ma: 1, Mb: 1, Ab: -120, Mc: 0.6, Ac: 120 } },
    { label: { fr: 'Homopolaire pur', en: 'Pure zero' }, p: { Ma: 1, Mb: 1, Ab: 0, Mc: 1, Ac: 0 } },
  ];
  const apply = (p: Record<string, number>) => Object.entries(p).forEach(([id, v]) => lab.setParam(id, v));
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Composantes symétriques', en: 'Symmetrical components' })}</span></header>
  <div class="body">
    <div class="sets">
      {#each sets as s (s.id)}
        <figure>
          <svg viewBox="0 0 120 120" role="img" aria-label={tr(s.name)}>
            <circle cx="60" cy="60" r={S} class="unit" />
            <line x1="8" x2="112" y1="60" y2="60" class="axis" />
            {#each s.phasors as z, j (j)}
              {@const tip = tipOf(z)}
              {#if cabs(z) > 1e-3}
                <line x1="60" y1="60" x2={tip[0]} y2={tip[1]} class="arm" style="stroke: var({colors[j]})" />
                <circle cx={tip[0]} cy={tip[1]} r="3" style="fill: var({colors[j]})" />
              {/if}
            {/each}
          </svg>
          <figcaption>{tr(s.name)} <b>{num(cabs(s.phasors[0]), 3)}</b></figcaption>
        </figure>
      {/each}
    </div>
    <div class="vuf" class:bad={k.vuf > 0.02}>
      {tr({ fr: 'Déséquilibre', en: 'Unbalance' })} |V₂|/|V₁| = <b>{isFinite(k.vuf) ? `${num(100 * k.vuf, 3)} %` : '∞'}</b>
    </div>
    <div class="presets">
      {#each presets as pr (pr.label.en)}
        <button class="btn" onclick={() => apply(pr.p)}>{tr(pr.label)}</button>
      {/each}
    </div>
  </div>
</section>

<style>
  .sets {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  figure {
    margin: 0;
    text-align: center;
  }
  svg {
    width: 100%;
    max-height: 130px;
    display: block;
  }
  figcaption {
    font-size: 12px;
    color: var(--muted);
  }
  figcaption b {
    font-family: var(--mono);
    color: var(--ink);
  }
  .unit {
    fill: none;
    stroke: var(--line);
    stroke-dasharray: 2 3;
  }
  .axis {
    stroke: var(--line);
  }
  .arm {
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .vuf {
    margin: 8px 0;
    font-size: 13px;
  }
  .vuf b {
    font-family: var(--mono);
  }
  .vuf.bad b {
    color: var(--warn);
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .presets .btn {
    font-size: 12px;
    padding: 2px 8px;
  }
</style>
