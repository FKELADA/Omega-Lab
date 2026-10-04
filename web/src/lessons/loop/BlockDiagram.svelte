<script lang="ts">
  // r → (Σ) → K → G(s) → y, with unity feedback. Live values at the time cursor.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { LoopInfo } from '../../lib/models/module3';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as LoopInfo);
  const e = $derived(lab.at('e'));
  const y = $derived(lab.at('y'));
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Boucle fermée', en: 'Closed loop' })}</span>
    <span class="spacer"></span>
    <span class="state" class:bad={!k.stable}>{k.stable ? tr({ fr: 'stable', en: 'stable' }) : tr({ fr: 'instable', en: 'unstable' })}</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 210" role="img" aria-label="Feedback loop">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" class="ah" />
        </marker>
      </defs>
      <text x="14" y="76" class="sig">r = 1</text>
      <line x1="40" y1="90" x2="78" y2="90" class="w" marker-end="url(#arr)" />
      <circle cx="92" cy="90" r="14" class="sum" />
      <text x="92" y="95" class="op">Σ</text>
      <text x="70" y="84" class="sgn">+</text>
      <text x="100" y="122" class="sgn">−</text>
      <line x1="106" y1="90" x2="148" y2="90" class="w" marker-end="url(#arr)" />
      <text x="127" y="80" class="sig">e</text>
      <rect x="150" y="70" width="52" height="40" rx="6" class="blk" />
      <text x="176" y="96" class="bl">K</text>
      <line x1="202" y1="90" x2="232" y2="90" class="w" marker-end="url(#arr)" />
      <rect x="234" y="66" width="110" height="48" rx="6" class="blk" />
      <text x="289" y="86" class="bs">1</text>
      <line x1="244" y1="91" x2="334" y2="91" class="frac" />
      <text x="289" y="106" class="bs">Π(1 + s/pₖ)</text>
      <line x1="344" y1="90" x2="392" y2="90" class="w" marker-end="url(#arr)" />
      <text x="372" y="80" class="sig">y</text>
      <path d="M368,90 V160 H92 V106" class="w" marker-end="url(#arr)" />

      <text x="92" y="190" class="val">e = {lab.concealed ? '?' : num(e, 3)}</text>
      <text x="200" y="190" class="val">K = {num(lab.params.K, 3)}</text>
      <text x="320" y="190" class="val">y = {lab.concealed ? '?' : num(y, 3)}</text>
      <text x="289" y="138" class="small">p = {num(lab.params.a, 3)}, {num(lab.params.b, 3)}, {num(lab.params.c, 3)} rad/s</text>
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 230px;
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
  .w {
    stroke: var(--muted);
    stroke-width: 2;
    fill: none;
  }
  .ah {
    fill: var(--muted);
  }
  .sum,
  .blk {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .op {
    fill: var(--ink);
    font-size: 15px;
  }
  .sgn {
    fill: var(--muted);
    font-size: 14px;
    font-weight: 700;
  }
  .bl {
    fill: var(--accent);
    font-size: 18px;
    font-weight: 700;
    font-style: italic;
  }
  .bs {
    fill: var(--ink);
    font-size: 13px;
  }
  .frac {
    stroke: var(--ink);
  }
  .sig {
    fill: var(--muted);
    font-size: 13px;
    font-style: italic;
  }
  .val {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
  }
  .small {
    fill: var(--faint);
    font-size: 10.5px;
  }
</style>
