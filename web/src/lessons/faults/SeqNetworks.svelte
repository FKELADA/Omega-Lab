<script lang="ts">
  // How the positive, negative and zero-sequence networks are connected for
  // each fault type, with their Thevenin impedances and currents. Each network
  // is a two-terminal box: F (fault point, top) and N (reference, bottom).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { cabs } from '../../lib/core/linalg';
  import { FAULT_TYPES, type FaultInfo } from '../../lib/models/module5';
  import { tr, type L } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as FaultInfo);
  const type = $derived(lab.params.type);
  const rows = [
    { name: { fr: 'directe', en: 'positive' } as L, sub: '1', y: 16 },
    { name: { fr: 'inverse', en: 'negative' } as L, sub: '2', y: 84 },
    { name: { fr: 'homopolaire', en: 'zero' } as L, sub: '0', y: 152 },
  ];
  const H = 44, X0 = 20, X1 = 176;
  const F = (r: number) => rows[r].y + 8;
  const N = (r: number) => rows[r].y + H - 8;
  const z = $derived([k.Z1, k.Z2, k.Z0]);
  const I = $derived([k.I012[1], k.I012[2], k.I012[0]]);
  /** Which networks carry current for this fault type. */
  const used = $derived(
    type === FAULT_TYPES.tph ? [true, false, false] : type === FAULT_TYPES.ll ? [true, true, false] : [true, true, true],
  );
  const rule: L[] = [
    { fr: 'Seul le réseau direct, court-circuité par Zf.', en: 'Only the positive network, shorted through Zf.' },
    { fr: 'Les trois réseaux en série, avec 3Zf : I₁ = I₂ = I₀.', en: 'All three networks in series, with 3Zf: I₁ = I₂ = I₀.' },
    { fr: 'Direct et inverse en opposition, à travers Zf : I₂ = −I₁.', en: 'Positive and negative in opposition, through Zf: I₂ = −I₁.' },
    { fr: 'Direct en série avec inverse ∥ (homopolaire + 3Zf).', en: 'Positive in series with negative ∥ (zero + 3Zf).' },
  ];
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Réseaux de séquence', en: 'Sequence networks' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 320 214" text-anchor="middle" role="img" aria-label="Sequence networks">
      {#each rows as r, j (j)}
        <g class:dim={!used[j]}>
          <rect x={X0} y={r.y} width={X1 - X0} height={H} rx="5" class="box" />
          <text x={X0 + 8} y={r.y + 16} class="name" text-anchor="start">{tr(r.name)}</text>
          <text x={X0 + 8} y={r.y + 32} class="z" text-anchor="start">
            Z<tspan baseline-shift="sub" font-size="8">{r.sub}</tspan> = {z[j] ? `${num(cabs(z[j]!), 3)} pu` : '∞'}
          </text>
          {#if j === 0}
            <circle cx={X1 - 26} cy={r.y + H / 2} r="9" class="src" />
            <text x={X1 - 26} y={r.y + H / 2 + 3.5} class="e">E</text>
          {/if}
          <text x={X1 - 4} y={F(j) + 3} class="t" text-anchor="end">F</text>
          <text x={X1 - 4} y={N(j) + 3} class="t" text-anchor="end">N</text>
          {#if !lab.concealed}
            <text x="314" y={r.y + H / 2 + 4} class="i" text-anchor="end">
              I<tspan baseline-shift="sub" font-size="8">{r.sub}</tspan> = {num(cabs(I[j]), 3)}
            </text>
          {/if}
        </g>
      {/each}

      <!-- connections -->
      <g class="wire">
        {#if type === FAULT_TYPES.tph}
          <path d="M{X1},{F(0)} H200 V{N(0)} H{X1}" />
          <rect x="194" y={(F(0) + N(0)) / 2 - 8} width="12" height="16" class="zf" />
        {:else if type === FAULT_TYPES.slg}
          <path d="M{X1},{N(0)} H196 V{F(1)} H{X1}" />
          <path d="M{X1},{N(1)} H196 V{F(2)} H{X1}" />
          <path d="M{X1},{N(2)} H232 V{F(0)} H{X1}" />
          <rect x="226" y={(F(0) + N(2)) / 2 - 10} width="12" height="20" class="zf" />
          <text x="244" y={(F(0) + N(2)) / 2 + 4} class="lbl" text-anchor="start">3Zf</text>
        {:else if type === FAULT_TYPES.ll}
          <path d="M{X1},{F(0)} H200 V{F(1)} H{X1}" />
          <path d="M{X1},{N(0)} H224 V{N(1)} H{X1}" />
          <rect x="194" y={(F(0) + F(1)) / 2 - 8} width="12" height="16" class="zf" />
        {:else}
          <path d="M{X1},{F(0)} H200 V{F(2)} H{X1}" />
          <path d="M{X1},{F(1)} H200" />
          <path d="M{X1},{N(0)} H226 V{N(2)} H{X1}" />
          <path d="M{X1},{N(1)} H226" />
          <rect x="194" y={(F(1) + F(2)) / 2 - 8} width="12" height="16" class="zf" />
          <text x="236" y={(F(1) + F(2)) / 2 + 4} class="lbl" text-anchor="start">3Zf</text>
        {/if}
      </g>
    </svg>
    <p class="note">{tr(rule[type])}</p>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .box {
    fill: var(--panel-2);
    stroke: var(--c-L);
    stroke-width: 1.5;
  }
  .dim {
    opacity: 0.35;
  }
  .name {
    fill: var(--muted);
    font-size: 10px;
  }
  .z {
    fill: var(--ink);
    font-size: 11px;
    font-family: var(--mono);
  }
  .src {
    fill: var(--panel);
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .e {
    fill: var(--c-S);
    font-size: 10px;
    font-weight: 700;
  }
  .t {
    fill: var(--muted);
    font-size: 9px;
    font-weight: 700;
  }
  .i {
    fill: var(--c-i);
    font-size: 11px;
    font-family: var(--mono);
    font-weight: 700;
  }
  .wire path {
    fill: none;
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .zf {
    fill: var(--panel);
    stroke: var(--c-R);
    stroke-width: 1.5;
  }
  .lbl {
    fill: var(--c-R);
    font-size: 10px;
  }
  .note {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--muted);
  }
</style>
