<script lang="ts">
  // How much of an AC circuit's current rating is left for real power, as its own
  // charging current grows with length. Cables, with their large capacitance, run
  // out after about a hundred kilometres. DC has no charging current in steady state.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { CAP_PER_KM, I_RATED, MEDIA, type DcAcInfo } from '../../lib/models/module1b';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();

  const W = 300, H = 200, M = { l: 36, r: 10, t: 10, b: 24 };
  const dMax = 400;
  const k = $derived(lab.info as DcAcInfo);
  const X = (d: number) => M.l + ((W - M.l - M.r) * d) / dMax;
  const Y = (f: number) => H - M.b - (H - M.t - M.b) * f;
  const curve = (medium: number) => {
    const ic = 2 * Math.PI * 50 * CAP_PER_KM[medium as 0 | 1] * ((lab.params.kV * 1e3) / Math.sqrt(3));
    let d = '';
    for (let j = 0; j <= 100; j++) {
      const km = (j / 100) * dMax;
      const u = Math.sqrt(Math.max(0, 1 - (Math.min(I_RATED, ic * km) / I_RATED) ** 2));
      d += `${j ? 'L' : 'M'}${X(km).toFixed(1)},${Y(u).toFixed(1)}`;
    }
    return d;
  };
</script>

<section class="panel">
  <header><span>{tr({ fr: 'Courant utile en AC', en: 'Usable AC current' })}</span></header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Usable AC current versus length">
      {#each [0, 0.5, 1] as f (f)}
        <line x1={M.l} x2={W - M.r} y1={Y(f)} y2={Y(f)} class="grid" />
        <text x={M.l - 4} y={Y(f) + 3} class="tick" text-anchor="end">{f * 100} %</text>
      {/each}
      {#each [0, 100, 200, 300, 400] as d (d)}
        <text x={X(d)} y={H - 8} class="tick">{d} km</text>
      {/each}
      <path d={curve(MEDIA.overhead)} class="oh" />
      <path d={curve(MEDIA.cable)} class="cable" />
      <line x1={X(Math.min(dMax, lab.params.km))} x2={X(Math.min(dMax, lab.params.km))} y1={M.t} y2={H - M.b} class="cursor" />
      <text x={X(dMax) - 4} y={Y(0.95)} class="lab oh-t" text-anchor="end">{tr({ fr: 'aérien', en: 'overhead' })}</text>
      <text x={X(60)} y={Y(0.35)} class="lab cable-t" text-anchor="start">{tr({ fr: 'câble', en: 'cable' })}</text>
    </svg>
    <div class="note">
      {tr({ fr: 'Courant de charge', en: 'Charging current' })} : <b>{num(k.chargingPerKm, 3)} A/km</b> ·
      {tr({ fr: 'longueur critique', en: 'critical length' })} : <b>{num(k.criticalKm, 3)} km</b>
    </div>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 210px;
    display: block;
  }
  text:not([text-anchor]) {
    text-anchor: middle;
  }
  .grid {
    stroke: var(--line);
  }
  .tick {
    fill: var(--muted);
    font-size: 9.5px;
  }
  .oh {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2.2;
  }
  .cable {
    fill: none;
    stroke: var(--c-C);
    stroke-width: 2.4;
  }
  .cursor {
    stroke: var(--ink);
    stroke-dasharray: 3 3;
  }
  .lab {
    font-size: 11px;
    font-weight: 700;
  }
  .oh-t {
    fill: var(--muted);
  }
  .cable-t {
    fill: var(--c-C);
  }
  .note {
    font-size: 12px;
    color: var(--muted);
  }
  .note b {
    color: var(--ink);
    font-family: var(--mono);
    font-weight: 500;
  }
</style>
