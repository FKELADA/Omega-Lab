<script lang="ts">
  // The motor spins at the simulated speed (the rotor marks turn with the
  // integral of speed), with its slip, current and state.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { IM, type ImInfo } from '../../lib/models/module4';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as ImInfo);
  /** Rotor angle: integral of speed up to the cursor, slowed down for display. */
  const angle = $derived.by(() => {
    const { t, s } = lab.run;
    let a = 0;
    for (let j = 1; j <= lab.idx; j++) a += 0.5 * (s.speed[j] + s.speed[j - 1]) * (t[j] - t[j - 1]);
    return a * 360 * 1.2;
  });
  const speed = $derived(lab.at('speed'));
  const inDip = $derived(lab.t >= IM.tDip && lab.t < IM.tDip + lab.params.dipDur && lab.params.dip < 1);
  const state = $derived(
    speed < 0.05 && lab.t > 0.5
      ? { fr: 'calé', en: 'stalled' }
      : speed > 0.9
        ? { fr: 'en marche', en: 'running' }
        : lab.t < IM.tDip && lab.params.start !== 1
          ? { fr: 'démarrage', en: 'starting' }
          : speed < lab.run.s.speed[Math.max(0, lab.idx - 1)]
            ? { fr: 'ralentit', en: 'slowing' }
            : { fr: 'réaccélère', en: 'recovering' },
  );
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Moteur asynchrone', en: 'Induction motor' })}</span>
    <span class="spacer"></span>
    <span class="state" class:bad={k.stalled}>{tr(state)}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" role="img" aria-label="Induction motor">
      <circle cx="110" cy="100" r="74" class="stator" />
      <g transform="rotate({angle} 110 100)">
        <circle cx="110" cy="100" r="48" class="rotor" />
        {#each [0, 60, 120, 180, 240, 300] as a (a)}
          <line x1="110" y1="100" x2={110 + 44 * Math.cos((a * Math.PI) / 180)} y2={100 + 44 * Math.sin((a * Math.PI) / 180)} class="bar" />
        {/each}
      </g>
      <circle cx="110" cy="100" r="6" class="hub" />
      <!-- load -->
      <line x1="184" y1="100" x2="240" y2="100" class="shaft" />
      {#if lab.params.type === 0}
        <g transform="rotate({angle} 260 100)">
          {#each [0, 120, 240] as a (a)}
            <ellipse cx={260 + 16 * Math.cos((a * Math.PI) / 180)} cy={100 + 16 * Math.sin((a * Math.PI) / 180)} rx="14" ry="6" transform="rotate({a} {260 + 16 * Math.cos((a * Math.PI) / 180)} {100 + 16 * Math.sin((a * Math.PI) / 180)})" class="blade" />
          {/each}
        </g>
        <text x="260" y="150" class="small">{tr({ fr: 'ventilateur (T ∝ ω²)', en: 'fan (T ∝ ω²)' })}</text>
      {:else}
        <rect x="240" y="80" width="44" height="40" rx="4" class="belt" />
        <text x="262" y="150" class="small">{tr({ fr: 'couple constant (convoyeur)', en: 'constant torque (conveyor)' })}</text>
      {/if}
      <text x="330" y="60" class="v">ω = {num(speed, 3)} pu</text>
      <text x="330" y="80" class="v">g = {num(1 - speed, 3)}</text>
      <text x="330" y="100" class="v">I = {lab.concealed ? '?' : `${num(lab.at('i'), 3)} pu`}</text>
      <text x="330" y="120" class="v" class:bad={inDip}>V = {num(lab.at('v'), 3)} pu</text>
      <text x="200" y="200" class="small">{tr({ fr: 'couple de démarrage', en: 'starting torque' })} {num(k.tStart, 3)} · {tr({ fr: 'couple maximal', en: 'breakdown torque' })} {num(k.tMax, 3)} pu</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 220px;
    display: block;
  }
  text {
    text-anchor: middle;
  }
  .state {
    text-transform: none;
    letter-spacing: 0;
    color: var(--good);
    font-weight: 700;
  }
  .state.bad {
    color: var(--warn);
  }
  .stator {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 2;
  }
  .rotor {
    fill: var(--panel);
    stroke: var(--c-L);
    stroke-width: 2.4;
  }
  .bar {
    stroke: var(--c-L);
    stroke-width: 3;
  }
  .hub {
    fill: var(--ink);
  }
  .shaft {
    stroke: var(--muted);
    stroke-width: 5;
  }
  .blade {
    fill: var(--c-C);
    opacity: 0.6;
  }
  .belt {
    fill: var(--panel-2);
    stroke: var(--c-R);
    stroke-width: 2;
  }
  .v {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
  }
  .v.bad {
    fill: var(--warn);
    font-weight: 700;
  }
  .small {
    fill: var(--muted);
    font-size: 10.5px;
  }
</style>
