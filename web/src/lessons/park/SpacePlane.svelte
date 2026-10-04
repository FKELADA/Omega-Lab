<script lang="ts">
  // The space vector v = vα + j·vβ. In the fixed view its shadows on the a, b, c
  // axes are the three phase voltages; in the rotating view the camera turns with
  // the dq frame, and a balanced set stands still.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { si } from '../../lib/ui/format';

  let { lab, rotating = false }: { lab: Lab; rotating?: boolean } = $props();

  const W = 300, H = 260;
  const R = 108;
  const ext = $derived(
    Math.max(1e-9, ...lab.run.s.valpha.map((a, j) => Math.hypot(a, lab.run.s.vbeta[j]))) * 1.12,
  );
  const k = $derived(R / ext);
  const th = $derived(lab.at('theta'));
  /** Rotation applied by the camera. */
  const cam = $derived(rotating ? -th : 0);
  const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  const P = (x: number, y: number): [number, number] => {
    const [u, v] = rot(x, y, cam);
    return [W / 2 + u * k, H / 2 - v * k];
  };

  const trail = $derived.by(() => {
    const { valpha, vbeta, theta } = lab.run.s;
    let d = '';
    for (let j = 0; j < valpha.length; j += 3) {
      // In the rotating view, each point is seen from the camera angle at its own time.
      const [u, v] = rotating ? rot(valpha[j], vbeta[j], -theta[j]) : [valpha[j], vbeta[j]];
      d += `${j ? 'L' : 'M'}${(W / 2 + u * k).toFixed(1)},${(H / 2 - v * k).toFixed(1)}`;
    }
    return d;
  });

  const tip = $derived(P(lab.at('valpha'), lab.at('vbeta')));
  // Phase axes in αβ: a at 0°, b at +120°, c at −120° (shadows give v_a, v_b, v_c).
  const axisAng = (id: string) => (id === 'a' ? 0 : id === 'b' ? (2 * Math.PI) / 3 : (-2 * Math.PI) / 3);
  const shadow = (id: string) => {
    const a = axisAng(id);
    const v = lab.at(`v${id}`);
    return P(v * Math.cos(a), v * Math.sin(a));
  };
  const axisEnd = (ang: number, r = ext) => P(r * Math.cos(ang), r * Math.sin(ang));
  const d = $derived(axisEnd(th, ext * 1.05));
  const q = $derived(axisEnd(th + Math.PI / 2, ext * 1.05));
  const enter = (t: string) => () => (lab.hover = t);
  const leave = () => (lab.hover = null);
</script>

<section class="panel">
  <header>
    <span>{rotating ? tr({ fr: 'Caméra dans le repère', en: 'Camera riding the frame' }) : tr({ fr: 'Plan fixe', en: 'Fixed plane' })} <span class="greek">{rotating ? 'dq' : 'αβ'}</span></span>
    <span class="spacer"></span>
    {#if rotating}<span class="note">{tr({ fr: 'la caméra tourne à', en: 'camera turns at' })} {si(lab.params.ratio * lab.params.f, 'Hz')}</span>{/if}
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Space vector">
      <!-- a, b, c axes -->
      {#each ['a', 'b', 'c'] as id (id)}
        {@const e = axisEnd(axisAng(id))}
        {@const e2 = axisEnd(axisAng(id) + Math.PI)}
        <g style="color: var(--c-{id})" data-term={id} role="presentation" onmouseenter={enter(id)} onmouseleave={leave}>
          <line x1={e2[0]} y1={e2[1]} x2={e[0]} y2={e[1]} class="phase" />
          <text x={e[0]} y={e[1]} dx="4" dy="-3" class="lbl">{id}</text>
          {#if !rotating}
            {@const s = shadow(id)}
            <line x1={tip[0]} y1={tip[1]} x2={s[0]} y2={s[1]} class="drop" />
            <circle cx={s[0]} cy={s[1]} r="4" class="dot" />
          {/if}
        </g>
      {/each}

      <!-- d, q axes -->
      <line x1={W / 2} y1={H / 2} x2={d[0]} y2={d[1]} class="dq" />
      <line x1={W / 2} y1={H / 2} x2={q[0]} y2={q[1]} class="dq q" />
      <text x={d[0]} y={d[1]} dx="4" dy="12" class="dql">d</text>
      <text x={q[0]} y={q[1]} dx="4" dy="-2" class="dql">q</text>

      <path d={trail} class="trail" />
      <line x1={W / 2} y1={H / 2} x2={tip[0]} y2={tip[1]} class="vec" />
      <circle cx={tip[0]} cy={tip[1]} r="5" class="tip" />
    </svg>
    <div class="readout">
      {#if rotating}
        <span>v<sub>d</sub> = {si(lab.at('vd'), 'V')}</span><span>v<sub>q</sub> = {si(lab.at('vq'), 'V')}</span>
      {:else}
        <span>v<sub>α</sub> = {si(lab.at('valpha'), 'V')}</span><span>v<sub>β</sub> = {si(lab.at('vbeta'), 'V')}</span>
      {/if}
    </div>
  </div>
</section>

<style>
  .body {
    display: flex;
    flex-direction: column;
  }
  svg {
    width: 100%;
    flex: 1;
    min-height: 170px;
    display: block;
  }
  .greek {
    text-transform: none;
    font-style: italic;
  }
  .note {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
    color: var(--faint);
  }
  .phase {
    stroke: currentColor;
    stroke-width: 1.2;
    opacity: 0.55;
  }
  .lbl {
    fill: currentColor;
    font-size: 12px;
    font-weight: 700;
  }
  .drop {
    stroke: currentColor;
    stroke-dasharray: 2 3;
  }
  .dot {
    fill: currentColor;
  }
  .dq {
    stroke: var(--accent);
    stroke-width: 1.6;
    stroke-dasharray: 6 4;
  }
  .dql {
    fill: var(--accent);
    font-size: 12px;
    font-weight: 700;
    font-style: italic;
  }
  .trail {
    fill: none;
    stroke: var(--faint);
    stroke-width: 1.2;
  }
  .vec {
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .tip {
    fill: var(--ink);
  }
  .readout {
    display: flex;
    gap: 14px;
    font-family: var(--mono);
    font-size: 11.5px;
    color: var(--muted);
  }
</style>
