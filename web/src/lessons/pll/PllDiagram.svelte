<script lang="ts">
  // The synchronous-reference-frame PLL as a control loop, with live values.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { PllInfo } from '../../lib/models/module3';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as PllInfo);
  const hide = $derived(lab.concealed);
</script>

<section class="panel">
  <header><span>{tr({ fr: 'PLL à repère synchrone', en: 'Synchronous-frame PLL' })}</span></header>
  <div class="body">
    <svg viewBox="0 0 400 230" role="img" aria-label="PLL block diagram">
      <defs>
        <marker id="arrp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" class="ah" />
        </marker>
      </defs>
      <text x="22" y="56" class="sig">v<tspan baseline-shift="sub" font-size="8">abc</tspan></text>
      <line x1="10" y1="70" x2="56" y2="70" class="w" marker-end="url(#arrp)" />
      <rect x="58" y="48" width="70" height="44" rx="6" class="blk" />
      <text x="93" y="68" class="bt">Park</text>
      <text x="93" y="84" class="bs">(θ̂)</text>
      <line x1="128" y1="70" x2="168" y2="70" class="w" marker-end="url(#arrp)" />
      <text x="148" y="62" class="sig">v<tspan baseline-shift="sub" font-size="8">q</tspan></text>
      <rect x="170" y="46" width="86" height="48" rx="6" class="blk pi" />
      <text x="213" y="67" class="bt">K<tspan baseline-shift="sub" font-size="8">p</tspan> + K<tspan baseline-shift="sub" font-size="8">i</tspan>/s</text>
      <text x="213" y="84" class="bs">{lab.params.type === 1 ? 'PI' : 'P'}</text>
      <line x1="256" y1="70" x2="290" y2="70" class="w" marker-end="url(#arrp)" />
      <rect x="292" y="52" width="40" height="36" rx="6" class="blk" />
      <path d="M300,80 L306,80 L318,60 L324,60" class="sat" />
      <line x1="332" y1="70" x2="358" y2="70" class="w" marker-end="url(#arrp)" />
      <rect x="360" y="52" width="34" height="36" rx="6" class="blk" />
      <text x="377" y="75" class="bt">1/s</text>
      <path d="M377,88 V140 H93 V94" class="w" marker-end="url(#arrp)" />
      <text x="240" y="134" class="sig">θ̂</text>
      <text x="345" y="44" class="small">Δω̂</text>

      <text x="70" y="176" class="val">v<tspan baseline-shift="sub" font-size="8">q</tspan> = {hide ? '?' : num(lab.at('vq'), 3)} pu</text>
      <text x="200" y="176" class="val">f̂ − 50 = {hide ? '?' : num(lab.at('fhat'), 3)} Hz</text>
      <text x="330" y="176" class="val">ε = {hide ? '?' : num(lab.at('err'), 3)}°</text>
      <text x="200" y="204" class="small">K<tspan baseline-shift="sub" font-size="7">p</tspan> = {num(k.Kp, 3)} rad/s/pu · K<tspan baseline-shift="sub" font-size="7">i</tspan> = {num(k.Ki, 3)} rad/s²/pu · {tr({ fr: 'limite', en: 'limit' })} ±{num(lab.params.lim, 3)} Hz</text>
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
  .w {
    stroke: var(--muted);
    stroke-width: 2;
    fill: none;
  }
  .ah {
    fill: var(--muted);
  }
  .blk {
    fill: var(--panel-2);
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .blk.pi {
    stroke: var(--accent);
  }
  .bt {
    fill: var(--ink);
    font-size: 13px;
    font-weight: 600;
  }
  .bs {
    fill: var(--muted);
    font-size: 11px;
  }
  .sat {
    fill: none;
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .sig {
    fill: var(--muted);
    font-size: 12px;
    font-style: italic;
  }
  .small {
    fill: var(--faint);
    font-size: 10.5px;
  }
  .val {
    fill: var(--ink);
    font-size: 12px;
    font-family: var(--mono);
  }
</style>
