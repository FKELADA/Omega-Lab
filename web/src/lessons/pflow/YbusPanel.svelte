<script lang="ts">
  // The bus admittance matrix, entry by entry. "Build" adds the lines one at a
  // time, so the learner sees each line touch exactly four entries. Hovering a
  // line or bus on the network highlights its entries here.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { ybus } from '../../lib/core/powerflow';
  import { lineName, network, NET } from '../../lib/models/module5';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const net = $derived(network(lab.params));
  const onLines = $derived(net.branches.map((b, k) => ({ b, k })).filter(({ b }) => b.on !== false));
  /** Number of lines added so far; null shows the full matrix. */
  let built = $state<number | null>(null);
  const shown = $derived(built === null ? onLines : onLines.slice(0, built));
  const Y = $derived(ybus(net.buses, net.branches.map((b, k) => ({ ...b, on: shown.some((s) => s.k === k) }))));
  const last = $derived(built !== null && built > 0 ? onLines[built - 1].k : null);

  function next() {
    built = built === null ? 0 : built + 1;
    if (built >= onLines.length) {
      built = null;
      lab.flags.ybuilt = true;
    }
  }

  const fmt = (re: number, im: number) => {
    if (Math.abs(re) < 1e-9 && Math.abs(im) < 1e-9) return '0';
    const s = im < 0 ? '−' : '+';
    return `${num(re, 2)}${s}j${num(Math.abs(im), 3)}`;
  };
  /** Is entry (i, k) touched by the hovered line or bus, or by the line just added? */
  function hot(i: number, k: number): boolean {
    const touches = (li: number) => {
      const l = NET.lines[li];
      return (i === l.from || i === l.to) && (k === l.from || k === l.to);
    };
    const h = lab.hover;
    if (h?.startsWith('l')) return touches(+h.slice(1));
    if (h?.startsWith('b')) return i === +h.slice(1) || k === +h.slice(1);
    return last !== null && touches(last);
  }
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Matrice d’admittance', en: 'Admittance matrix' })} <span class="nocase">Y</span></span>
    <span class="spacer"></span>
    <button class="btn small" onclick={next}>
      {built === null
        ? tr({ fr: 'Construire pas à pas', en: 'Build step by step' })
        : built < onLines.length
          ? tr({ fr: `Ajouter la ligne ${lineName(onLines[built].k)}`, en: `Add line ${lineName(onLines[built].k)}` })
          : tr({ fr: 'Terminé', en: 'Done' })}
    </button>
  </header>
  <div class="body">
    <table>
      <thead>
        <tr>
          <th></th>
          {#each [1, 2, 3, 4] as c (c)}<th>{c}</th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each Y as row, i (i)}
          <tr>
            <th>{i + 1}</th>
            {#each row as y, k (k)}
              <td class:diag={i === k} class:zero={Math.abs(y.re) + Math.abs(y.im) < 1e-9} class:hot={hot(i, k)}>{fmt(y.re, y.im)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <p class="note">
      {#if built !== null}
        {tr({
          fr: `${built} ligne(s) sur ${onLines.length}. Chaque ligne i–k ajoute y à Yii et Ykk, et −y à Yik et Yki.`,
          en: `${built} of ${onLines.length} lines. Each line i–k adds y to Yii and Ykk, and −y to Yik and Yki.`,
        })}
      {:else}
        {tr({
          fr: 'Hors diagonale : −y de la ligne (0 s’il n’y en a pas). Diagonale : somme des y connectées, plus les demi-capacités et les shunts. Survolez une ligne du réseau.',
          en: 'Off-diagonal: −y of the line (0 if none). Diagonal: sum of connected y, plus half-charging and shunts. Hover a line on the network.',
        })}
      {/if}
    </p>
  </div>
</section>

<style>
  table {
    border-collapse: collapse;
    width: 100%;
    font-family: var(--mono);
    font-size: 10.5px;
    table-layout: fixed;
  }
  th {
    color: var(--muted);
    font-weight: 600;
    padding: 4px;
  }
  thead th:first-child {
    width: 18px;
  }
  td {
    padding: 6px 2px;
    text-align: center;
    border: 1px solid var(--line, #ddd);
    white-space: nowrap;
  }
  td.diag {
    background: var(--panel-2);
    font-weight: 700;
  }
  td.zero {
    color: var(--muted);
  }
  td.hot {
    background: var(--accent-soft);
    color: var(--accent);
  }
  .note {
    margin: 8px 0 0;
    font-size: 12px;
    color: var(--muted);
  }
  .btn.small {
    font-size: 11.5px;
    padding: 3px 8px;
    text-transform: none;
    letter-spacing: 0;
  }
</style>
