<script lang="ts">
  // The five-node 400 kV system at the cursor hour: N-state flows on each line, coloured red
  // when the line would be overloaded after the worst single contingency.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { N1, TOPO, TOPO_LINES, dcFlows, n1At, n1Injections } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const pos: [number, number][] = [
    [50, 110], // Interco
    [200, 232], // Nucléaire
    [200, 168], // Ville A
    [345, 110], // Ville B
    [200, 40], // Industrie
  ];
  const out = $derived(TOPO_LINES[Math.round(lab.params.topo)] ?? []);
  const P = $derived(n1Injections(lab.params, lab.t));
  const flows = $derived(dcFlows(P, out, lab.params.alpha * N1.mwPerDeg));
  const r = $derived(n1At(lab.params, lab.t));
  // Node name offsets, clear of the lines.
  const labelAt: [number, number][] = [
    [0, 24],
    [52, 4],
    [-48, 4],
    [0, 24],
    [0, -14],
  ];
  // L8 runs alongside L7: draw it a little lower.
  const off = (i: number) => (i === 7 ? 9 : 0);
  const hour = $derived(`${Math.floor(lab.t)} h ${String(Math.round((lab.t % 1) * 60)).padStart(2, '0')}`);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if Math.max(...r.worst) > 100}<span class="kit-warn">{tr({ fr: 'contrainte N-1', en: 'N-1 constraint' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 250" role="img" aria-label="Meshed transmission grid">
      {#each N1.lines as l, i (l.name)}
        {@const [x1, y1] = pos[l.a]}
        {@const [x2, y2] = pos[l.b]}
        {@const open = out.includes(i)}
        <line x1={x1} y1={y1 + off(i)} x2={x2} y2={y2 + off(i)} class={open ? 'thin' : r.worst[i] > 100 ? 'w hot' : 'w'} stroke-dasharray={open ? '5 4' : undefined} />
        {@const len = Math.hypot(x2 - x1, y2 - y1)}
        <text x={(x1 + x2) / 2 - (12 * (y2 - y1)) / len} y={(y1 + y2) / 2 + off(i) * 2 + (12 * (x2 - x1)) / len - (i === 7 ? 0 : 4)} class="small">
          {l.name}{open ? ` (${tr({ fr: 'ouverte', en: 'open' })})` : ` ${num(Math.abs(flows[i]), 3)}`}
        </text>
        {#if i === N1.pst && !open}
          <rect x={(x1 + x2) / 2 - 22} y={(y1 + y2) / 2 + 2} width="14" height="10" rx="2" class="box" />
          <text x={(x1 + x2) / 2 - 15} y={(y1 + y2) / 2 + 10} class="small">α</text>
        {/if}
      {/each}
      {#each N1.nodes as name, i (name)}
        <circle cx={pos[i][0]} cy={pos[i][1]} r="9" class={P[i] > 0 ? 'src' : 'box'} />
        <text x={pos[i][0] + labelAt[i][0]} y={pos[i][1] + labelAt[i][1]} class="v">{name}</text>
      {/each}
      <text x="70" y="235" class="small">{hour} · MW (N)</text>
      {#if lab.params.topo === TOPO.closeL8}<text x="345" y="150" class="small">{tr({ fr: 'Icc ↑', en: 'Isc ↑' })}</text>{/if}
    </svg>
  </div>
</section>
