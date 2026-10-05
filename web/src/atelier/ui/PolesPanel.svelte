<script lang="ts">
  // Poles of the learner's own circuit (inverse Tustin of the EMT step), on the
  // s-plane and in a table. Clicking a pole lights up, on the bench, the
  // inductors and capacitors that make it (participation factors).
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { Modal } from '../engine/modal';
  import { useBench } from './context';
  import { si } from '../library';
  import { tr } from '../../lib/ui/ui.svelte';

  let { lab }: { lab: Lab } = $props();
  const bench = useBench();
  const md = $derived(lab.info.modal as Modal);
  /** One row per mode: real poles, and the upper pole of each complex pair. */
  const rows = $derived(
    md.poles
      .map((p, j) => ({ p, j }))
      .filter(({ p }) => p.s.im >= -1e-9 * Math.abs(p.s.re))
      .map(({ p, j }) => {
        const w = Math.hypot(p.s.re, p.s.im);
        const top = md.states.map((id, k) => ({ id, v: p.part[k] })).sort((a, b) => b.v - a.v).filter((x) => x.v > 0.05);
        return { j, s: p.s, f: Math.abs(p.s.im) / (2 * Math.PI), zeta: w > 0 ? -p.s.re / w : 1, tau: p.s.re < 0 ? -1 / p.s.re : Infinity, top, part: p.part };
      }),
  );
  let picked = $state<number | null>(null);
  function pick(r: (typeof rows)[number]) {
    picked = picked === r.j ? null : r.j;
    bench.highlight = picked === null ? null : Object.fromEntries(md.states.map((id, k) => [id, r.part[k]]));
  }
  $effect(() => () => (bench.highlight = null));

  // s-plane, symmetric log-like scale so fast and slow poles both show.
  const W = 300, H = 200;
  const sc = $derived(Math.max(1, ...md.poles.map((p) => Math.max(Math.abs(p.s.re), Math.abs(p.s.im)))) * 1.15);
  const g = (v: number) => (Math.sign(v) * Math.log10(1 + Math.abs(v))) / Math.log10(1 + sc);
  // Left half-plane over most of the width; unstable poles in a narrow strip on the right.
  const X = (re: number) => W - 20 + (re > 0 ? 16 : W - 40) * g(re);
  const Y = (im: number) => H / 2 - (H / 2 - 12) * g(im);
</script>

<section class="panel poles">
  <header>
    <span>{tr({ fr: 'Pôles du circuit', en: 'Circuit poles' })}</span>
    <span class="spacer"></span>
    <span class="n">{md.states.length} {tr({ fr: 'états', en: 'states' })} (L, C)</span>
  </header>
  <div class="body">
    {#if !md.poles.length}
      <p class="msg">
        {tr({
          fr: 'Pas de pôle : il faut au moins une bobine ou un condensateur relié au reste du circuit.',
          en: 'No pole: at least one inductor or capacitor connected to the rest of the circuit is needed.',
        })}
      </p>
    {:else}
      <div class="grid">
        <svg viewBox="0 0 {W} {H}" role="img" aria-label="s-plane">
          <line x1="0" x2={W} y1={H / 2} y2={H / 2} class="axis" />
          <line x1={W - 20} x2={W - 20} y1="0" y2={H} class="axis" />
          <text x={W - 16} y="12" class="ax">jω</text>
          <text x="4" y={H / 2 - 4} class="ax">σ (log)</text>
          {#each md.poles as p, j (j)}
            {@const on = picked !== null && (j === picked || (Math.abs(p.s.re - md.poles[picked].s.re) < 1e-9 * (1 + Math.abs(p.s.re)) && Math.abs(p.s.im + md.poles[picked].s.im) < 1e-9 * (1 + Math.abs(p.s.im))))}
            <g class="x" class:on class:unstable={p.s.re > 0} transform="translate({X(p.s.re)},{Y(p.s.im)})">
              <line x1="-5" y1="-5" x2="5" y2="5" /><line x1="-5" y1="5" x2="5" y2="-5" />
            </g>
          {/each}
        </svg>
        <div class="scroll">
          <table>
            <thead>
              <tr><th>s</th><th>f</th><th>ζ</th><th>τ</th><th>{tr({ fr: 'éléments', en: 'elements' })}</th></tr>
            </thead>
            <tbody>
              {#each rows as r (r.j)}
                <tr class:sel={picked === r.j} class:unstable={r.s.re > 0} onclick={() => pick(r)}>
                  <td class="mono">{r.s.re.toPrecision(3)}{r.s.im > 1e-9 ? ` ± j${r.s.im.toPrecision(3)}` : ''}</td>
                  <td class="mono">{r.f > 0 ? si(r.f, 'Hz') : '—'}</td>
                  <td class="mono">{r.s.im > 1e-9 ? r.zeta.toFixed(3) : '—'}</td>
                  <td class="mono">{Number.isFinite(r.tau) ? si(r.tau, 's') : '∞'}</td>
                  <td>{r.top.map((x) => `${x.id} ${Math.round(100 * x.v)} %`).join(' · ')}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
      <p class="note">
        {tr({
          fr: 'Calculés à partir du pas du simulateur (transformée de Tustin inverse). Cliquez sur un pôle : les éléments qui le font s’allument sur le plan de travail.',
          en: 'Computed from the simulator’s step (inverse Tustin transform). Click a pole: the elements that make it light up on the bench.',
        })}
      </p>
    {/if}
  </div>
</section>

<style>
  .n {
    color: var(--muted);
    font-family: var(--mono);
    text-transform: none;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
    gap: 10px;
    align-items: start;
  }
  svg {
    width: 100%;
    height: auto;
    background: var(--panel-2);
    border-radius: 6px;
  }
  .axis {
    stroke: var(--line);
  }
  .ax {
    font-size: 9px;
    fill: var(--muted);
  }
  .x line {
    stroke: var(--c-p);
    stroke-width: 2.4;
  }
  .x.unstable line {
    stroke: var(--warn);
  }
  .x.on line {
    stroke: var(--accent);
    stroke-width: 3.4;
  }
  .scroll {
    max-height: 220px;
    overflow: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11.5px;
  }
  th {
    text-align: left;
    color: var(--muted);
    font-weight: 600;
    border-bottom: 1px solid var(--line);
    padding: 2px 4px;
    position: sticky;
    top: 0;
    background: var(--panel);
  }
  td {
    padding: 3px 4px;
    border-bottom: 1px solid var(--line);
  }
  tbody tr {
    cursor: pointer;
  }
  tbody tr:hover {
    background: var(--panel-2);
  }
  tr.sel {
    background: var(--accent-soft);
  }
  tr.unstable td:first-child {
    color: var(--warn);
    font-weight: 700;
  }
  .mono {
    font-family: var(--mono);
    white-space: nowrap;
  }
  .msg,
  .note {
    color: var(--muted);
    font-size: 12px;
  }
  .note {
    margin: 6px 0 0;
  }
</style>
