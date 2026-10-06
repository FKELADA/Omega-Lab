<script lang="ts">
  // A control zone: two generators, the pilot node, the load, the switched capacitors and
  // reactors, and the secondary controller sending the same level N to both machines.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { RST, VPLAN } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const h = $derived(lab.t);
  const caps = $derived(lab.params.Qc > 0 && h >= VPLAN.caps[0] && h < VPLAN.caps[1]);
  const reac = $derived(lab.params.QL > 0 && (h >= VPLAN.reactors[0] || h < VPLAN.reactors[1]));
  const vp = $derived(lab.at('vp'));
  const lvl = $derived([lab.at('q1') / VPLAN.Qr[0], lab.at('q2') / VPLAN.Qr[1]]);
  const on = $derived(lab.params.rst === RST.on);
  const gy = (v: number) => 200 - ((v - 380) / 45) * 150;
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    {#if Math.max(...lvl.map(Math.abs)) > 0.995}<span class="kit-warn">{tr({ fr: 'groupes en butée', en: 'generators at their limit' })}</span>{/if}
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 230" role="img" aria-label="Voltage control zone">
      <!-- generators -->
      {#each [0, 1] as i (i)}
        <g transform="translate(40,{60 + i * 90})">
          <circle r="16" class="src" />
          <path d="M-9,0 c3,-8 5,-8 9,0 s5,8 9,0" class="sym" />
          <text y="32" class="small">G{i + 1} · N = {num(lvl[i], 2)}</text>
          <rect x="22" y="-28" width="40" height="8" rx="2" class="track" />
          <rect x={22 + 20 * Math.min(0, lvl[i])} y="-28" width={20 * Math.abs(lvl[i])} height="8" rx="2" class="bar" class:bad={Math.abs(lvl[i]) > 0.995} transform="translate(20,0)" />
          <line x1="16" y1="0" x2="160" y2={55 - i * 90} class="w" />
        </g>
      {/each}
      <!-- pilot node and load -->
      <line x1="200" y1="80" x2="200" y2="150" class="bus" />
      <text x="200" y="70" class="v">{tr({ fr: 'nœud pilote', en: 'pilot node' })}</text>
      <line x1="200" y1="115" x2="250" y2="115" class="w" />
      <path d="M250,115 v16 m-7,-7 l7,9 l7,-9" class="load" />
      <!-- capacitors and reactors -->
      <line x1="200" y1="150" x2="200" y2="170" class="w" />
      <g class:dim={!caps}>
        <line x1="180" y1="176" x2="200" y2="176" class="cap" />
        <line x1="180" y1="184" x2="200" y2="184" class="cap" />
        <text x="178" y="204" class="small">C {num(lab.params.Qc, 3)}</text>
      </g>
      <g class:dim={!reac}>
        <path d="M212,170 a5,5 0 0 1 0,10 a5,5 0 0 1 0,10" class="coil" />
        <text x="232" y="204" class="small">L {num(lab.params.QL, 3)}</text>
      </g>
      <!-- secondary controller -->
      <rect x="150" y="14" width="100" height="24" rx="4" class="box" class:dim={!on} />
      <text x="200" y="30" class="small">RST · V<tspan baseline-shift="sub" font-size="8">c</tspan> = {num(lab.params.Vc, 4)} kV</text>
      {#if on}<path d="M150,26 H70 V44 M150,26 H60 V134" class="thin" />{/if}
      <!-- pilot voltage gauge -->
      <g transform="translate(320,0)">
        <rect x="0" y="50" width="22" height="150" rx="3" class="track" />
        <rect x="0" y={gy(420)} width="22" height={gy(380) - gy(420)} class="band" />
        <line x1="-6" y1={gy(vp)} x2="28" y2={gy(vp)} class="w hot" />
        <text x="11" y="44" class="v">{num(vp, 4)} kV</text>
        <text x="40" y={gy(420) + 4} class="small">420</text>
        <text x="40" y={gy(380) + 4} class="small">380</text>
      </g>
    </svg>
  </div>
</section>
