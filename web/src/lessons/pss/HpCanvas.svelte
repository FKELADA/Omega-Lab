<script lang="ts">
  // The Heffron–Phillips block diagram: the mechanical loop (K1, 2H, ω0), the
  // field loop (K2, K3, K4) and the voltage regulator path (K5, K6, AVR), with
  // the PSS feeding the AVR from the speed deviation. Live K values.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import type { HpInfo } from '../../lib/models/module8';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as HpInfo);
  const K = $derived(k.K);
  const pssOn = $derived(lab.params.Kpss > 0.05);
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Modèle de Heffron–Phillips', en: 'Heffron–Phillips model' })}</span>
    <span class="spacer"></span>
    <span class:warn={!k.stable} class:ok={k.stable}>ζ = {num(100 * k.zeta, 3)} %</span>
  </header>
  <div class="body">
    <svg viewBox="0 0 400 214" text-anchor="middle" role="img" aria-label="Heffron–Phillips block diagram">
      <defs>
        <marker id="hp-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L8,4 L0,8 z" class="ah" /></marker>
      </defs>
      <!-- mechanical loop -->
      <circle cx="40" cy="40" r="9" class="sum" />
      <text x="16" y="36" class="sig">ΔTm</text>
      <line x1="22" y1="40" x2="31" y2="40" class="w" marker-end="url(#hp-arr)" />
      <rect x="64" y="26" width="56" height="28" rx="4" class="blk mech" />
      <text x="92" y="44" class="tf">1/2Hs</text>
      <line x1="49" y1="40" x2="64" y2="40" class="w" marker-end="url(#hp-arr)" />
      <rect x="150" y="26" width="44" height="28" rx="4" class="blk mech" />
      <text x="172" y="44" class="tf">ω₀/s</text>
      <line x1="120" y1="40" x2="150" y2="40" class="w" marker-end="url(#hp-arr)" />
      <text x="135" y="34" class="sig">Δω</text>
      <line x1="194" y1="40" x2="380" y2="40" class="w" />
      <text x="372" y="34" class="sig">Δδ</text>
      <!-- K1 feedback -->
      <rect x="230" y="62" width="44" height="22" rx="4" class="blk" />
      <text x="252" y="77" class="tf">K₁ {num(K.K1, 2)}</text>
      <path d="M262,40 V62" class="w" />
      <path d="M230,73 H40 V49" class="w" marker-end="url(#hp-arr)" />
      <!-- field loop -->
      <rect x="230" y="96" width="44" height="22" rx="4" class="blk" />
      <text x="252" y="111" class="tf">K₄ {num(K.K4, 2)}</text>
      <path d="M296,40 V107 H274" class="w" marker-end="url(#hp-arr)" />
      <circle cx="196" cy="140" r="9" class="sum" />
      <path d="M230,107 H196 V131" class="w" marker-end="url(#hp-arr)" />
      <rect x="100" y="126" width="72" height="28" rx="4" class="blk field" />
      <text x="136" y="144" class="tf">K₃/(1+sK₃T′d0)</text>
      <line x1="187" y1="140" x2="172" y2="140" class="w" marker-end="url(#hp-arr)" />
      <text x="70" y="136" class="sig">ΔE′q</text>
      <rect x="38" y="96" width="44" height="22" rx="4" class="blk" />
      <text x="60" y="111" class="tf">K₂ {num(K.K2, 2)}</text>
      <path d="M100,140 H60 V118" class="w" marker-end="url(#hp-arr)" />
      <path d="M60,96 V82" class="w" />
      <!-- AVR path -->
      <rect x="290" y="126" width="44" height="22" rx="4" class="blk" />
      <text x="312" y="141" class="tf">K₅ {num(K.K5, 2)}</text>
      <path d="M330,40 V126" class="w" marker-end="url(#hp-arr)" />
      <rect x="290" y="166" width="44" height="22" rx="4" class="blk" />
      <text x="312" y="181" class="tf">K₆ {num(K.K6, 2)}</text>
      <path d="M80,154 V177 H290" class="w" marker-end="url(#hp-arr)" />
      <rect x="212" y="166" width="58" height="34" rx="4" class="blk avr" />
      <text x="241" y="181" class="tf">AVR</text>
      <text x="241" y="194" class="tf">K<tspan baseline-shift="sub" font-size="6">A</tspan> = {num(lab.params.KA, 3)}</text>
      <path d="M312,148 V158 H260" class="w" />
      <path d="M241,166 V149" class="w" marker-end="url(#hp-arr)" />
      <text x="214" y="160" class="sig">ΔEfd</text>
      <!-- PSS -->
      <rect x="338" y="62" width="52" height="40" rx="4" class="blk pss" class:off={!pssOn} />
      <text x="364" y="79" class="tf">PSS</text>
      <text x="364" y="93" class="tf">K = {num(lab.params.Kpss, 3)}</text>
      <path d="M364,40 V62" class="w" class:off={!pssOn} />
      <path d="M364,102 V205 H241 V200" class="w pss-l" class:off={!pssOn} marker-end="url(#hp-arr)" />
    </svg>
  </div>
</section>

<style>
  svg {
    width: 100%;
    height: auto;
    max-height: 240px;
    display: block;
  }
  .warn {
    color: var(--warn);
    font-weight: 700;
    text-transform: none;
  }
  .ok {
    color: var(--good);
    font-weight: 700;
    text-transform: none;
  }
  .sum {
    fill: var(--panel);
    stroke: var(--ink);
    stroke-width: 1.4;
  }
  .w {
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.4;
  }
  .w.off {
    stroke: var(--line);
    stroke-dasharray: 3 3;
  }
  .pss-l {
    stroke: var(--c-p);
  }
  .ah {
    fill: var(--muted);
  }
  .blk {
    fill: var(--panel-2);
    stroke: var(--muted);
    stroke-width: 1.3;
  }
  .blk.mech {
    stroke: var(--c-S);
  }
  .blk.field {
    stroke: var(--c-L);
  }
  .blk.avr {
    stroke: var(--c-R);
  }
  .blk.pss {
    stroke: var(--c-p);
    stroke-width: 2;
  }
  .blk.pss.off {
    stroke: var(--line);
  }
  .tf {
    fill: var(--ink);
    font-size: 8.5px;
    font-family: var(--mono);
  }
  .sig {
    fill: var(--muted);
    font-size: 9px;
    font-style: italic;
  }
</style>
