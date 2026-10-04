<script lang="ts">
  // The power–angle curve Pe = Pmax sin δ, the mechanical power before and after
  // the step, the operating point at the cursor, and the tangent at δ0 — which is
  // exactly what linearisation keeps.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { SmibInfo } from '../../lib/models/module3';
  import { S, tr, ui } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 220, M = { l: 32, r: 10, t: 10, b: 24 };
  const k = $derived(lab.info as SmibInfo);
  const pmax = $derived(Math.max(lab.params.Pmax, lab.params.Pm0 + Math.max(0, lab.params.dP)) * 1.15);
  const X = (deg: number) => M.l + ((W - M.l - M.r) * deg) / 200;
  const Y = (p: number) => H - M.b - ((H - M.t - M.b) * (p + 0.15)) / (pmax + 0.15);
  const curve = $derived(
    Array.from({ length: 101 }, (_, j) => {
      const d = 2 * j;
      return `${j ? 'L' : 'M'}${X(d).toFixed(1)},${Y(lab.params.Pmax * Math.sin((d * Math.PI) / 180)).toFixed(1)}`;
    }).join(''),
  );
  const d0 = $derived((k.delta0 * 180) / Math.PI);
  const pm0 = $derived(lab.params.Pmax * Math.sin(k.delta0));
  // Tangent: P = P0 + Ks·(δ − δ0), over ±35°.
  const tan = $derived.by(() => {
    const a = d0 - 35, b = d0 + 35;
    const p = (dd: number) => pm0 + k.Ks * ((dd - d0) * Math.PI) / 180;
    return { x1: X(a), y1: Y(p(a)), x2: X(b), y2: Y(p(b)) };
  });
  const dNow = $derived(lab.at('delta'));
</script>

<section class="panel">
  <header>
    <span>{#if ui.lang === 'fr'}Courbe <span class="nocase">P–δ</span>{:else}<span class="nocase">P–δ</span> curve{/if}</span>
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Power-angle curve">
      {#each [0, 45, 90, 135, 180] as d (d)}
        <line x1={X(d)} x2={X(d)} y1={M.t} y2={H - M.b} class="grid" />
        <text x={X(d)} y={H - 8} class="tick">{d}°</text>
      {/each}
      <line x1={M.l} x2={W - M.r} y1={Y(0)} y2={Y(0)} class="axis" />
      <text x={M.l - 4} y={Y(lab.params.Pmax) + 3} class="tick" text-anchor="end">P<tspan baseline-shift="sub" font-size="7">max</tspan></text>

      <path d={curve} class="pe" />
      <line x1={M.l} x2={W - M.r} y1={Y(pm0)} y2={Y(pm0)} class="pm0" />
      <line x1={M.l} x2={W - M.r} y1={Y(pm0 + lab.params.dP)} y2={Y(pm0 + lab.params.dP)} class="pm1" />
      <line {...tan} class="tan" />
      <circle cx={X(d0)} cy={Y(pm0)} r="4" class="eq" />
      <circle cx={X(180 - d0)} cy={Y(pm0)} r="4" class="ueq" />
      {#if dNow <= 200}
        <circle cx={X(dNow)} cy={Y(lab.at('pe'))} r="5.5" class="now" />
      {/if}
    </svg>
    <div class="legend">
      <span><i class="l-pe"></i>P<sub>e</sub> = P<sub>max</sub> sin δ</span>
      <span><i class="l-pm"></i>P<sub>m</sub></span>
      <span><i class="l-tan"></i>{tr({ fr: 'tangente (linéarisation)', en: 'tangent (linearisation)' })}</span>
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .grid {
    stroke: var(--line);
  }
  .axis {
    stroke: var(--faint);
  }
  .tick {
    fill: var(--muted);
    font-size: 10px;
  }
  .pe {
    fill: none;
    stroke: var(--c-p);
    stroke-width: 2.2;
  }
  .pm0 {
    stroke: var(--c-S);
    stroke-dasharray: 3 3;
  }
  .pm1 {
    stroke: var(--c-S);
    stroke-width: 1.8;
  }
  .tan {
    stroke: var(--c-R);
    stroke-width: 1.8;
  }
  .eq {
    fill: var(--good);
  }
  .ueq {
    fill: var(--panel);
    stroke: var(--warn);
    stroke-width: 2;
  }
  .now {
    fill: var(--accent);
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 12px;
    font-size: 11.5px;
    color: var(--muted);
  }
  .legend i {
    display: inline-block;
    width: 12px;
    height: 3px;
    margin-right: 4px;
    vertical-align: middle;
  }
  .l-pe {
    background: var(--c-p);
  }
  .l-pm {
    background: var(--c-S);
  }
  .l-tan {
    background: var(--c-R);
  }
</style>
