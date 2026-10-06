<script lang="ts">
  // The three candidate substations, the project plugged into the chosen one, and a
  // checklist of the three criteria of the study.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { SCR_MIN, SITES, TECH, type StudyInfo } from '../../lib/models/module9';
  import { S, tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';
  import '../kit.css';

  let { lab }: { lab: Lab } = $props();
  const k = $derived(lab.info as StudyInfo);
  const here = $derived(Math.round(lab.params.site));
  const sync = $derived(lab.params.tech === TECH.sync);
  const rows = $derived([
    { ok: k.load <= 100, label: tr({ fr: 'capacité N-1', en: 'N-1 capacity' }), v: `${num(k.load, 3)} %` },
    { ok: sync || k.scr >= SCR_MIN, label: tr({ fr: `SCR ≥ ${SCR_MIN}`, en: `SCR ≥ ${SCR_MIN}` }), v: sync ? '—' : num(k.scr, 3) },
    { ok: k.icc <= k.site.Ibreak, label: tr({ fr: 'pouvoir de coupure', en: 'breaking capacity' }), v: `${num(k.icc, 3)} / ${k.site.Ibreak} kA` },
  ]);
</script>

<section class="panel">
  <header>
    <span>{tr(S.circuit)}</span>
    <span class="spacer"></span>
    <span class={k.ok ? '' : 'kit-warn'}>{k.ok ? tr({ fr: 'raccordement possible', en: 'connection possible' }) : tr({ fr: 'refusé en l’état', en: 'refused as is' })}</span>
  </header>
  <div class="body">
    <svg class="kit" viewBox="0 0 400 220" role="img" aria-label="Candidate substations">
      {#each SITES as s, i (s.name)}
        <g transform="translate({60 + i * 140},50)" class:dim={i !== here}>
          <line x1="-30" y1="0" x2="30" y2="0" class="bus" />
          <text y="-14" class="v">{s.name.replace('Poste ', '')}</text>
          <text y="20" class="small">S<tspan baseline-shift="sub" font-size="8">cc</tspan> {num(s.Scc / 1000, 3)} GVA</text>
          {#if i === here}
            <line x1="0" y1="0" x2="0" y2="50" class="w" />
            <circle cx="0" cy="64" r="14" class={sync ? 'src' : 'box'} />
            <text y="68" class="small">{sync ? '~' : '≋'}</text>
            <text y="96" class="v">{num(lab.params.P, 4)} MW</text>
          {/if}
        </g>
      {/each}
      {#each rows as r, i (i)}
        <g transform="translate(40,{168 + i * 18})">
          <text x="0" y="0" class={r.ok ? 'small ok' : 'small bad'} style="text-anchor: start">{r.ok ? '✓' : '✗'} {r.label}</text>
          <text x="320" y="0" class="small">{r.v}</text>
        </g>
      {/each}
    </svg>
  </div>
</section>
