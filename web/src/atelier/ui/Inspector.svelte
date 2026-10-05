<script lang="ts">
  // The selected element's parameters (slider + typed value with units), what it
  // shows on the oscilloscope, and its live values. Without a selection: the
  // project, the run settings, templates and the solver's messages.
  import type { Bench } from '../bench.svelte';
  import { DEFS, si, type ElParam } from '../library';
  import { TEMPLATES } from '../templates';
  import { parseSI } from '../units';
  import { lastPeriods, meanProduct, stats } from '../engine/harmonics';
  import { fundamental } from '../analyses';
  import type { Steady } from '../analyses';
  import { tr } from '../../lib/ui/ui.svelte';
  import { renderMarkdown, renderMath } from '../../lib/ui/markdown';

  let { bench, onfit }: { bench: Bench; onfit: () => void } = $props();
  const lab = $derived(bench.lab);
  const sel = $derived(bench.selection);
  const el = $derived(sel?.kind === 'el' ? bench.el(sel.id) : undefined);
  const def = $derived(el ? DEFS[el.type] : undefined);
  const nPicked = $derived(bench.picked.els.length + bench.picked.wires.length);

  // Measurements over the last whole periods of the fundamental (or the second half of the run).
  const meas = $derived.by(() => {
    if (!el || !def) return null;
    const run = lab.run;
    const v = run.s[`${el.id}.v`], i = run.s[`${el.id}.i`];
    if (!v && !i) return null;
    const f1 = fundamental(bench.compiled.net, lab.params);
    const w = (f1 && lastPeriods(run.t, f1)) || { k0: Math.floor(run.t.length / 2), k1: run.t.length - 1 };
    const sv = v ? stats(run.t, v, w) : null, si_ = i ? stats(run.t, i, w) : null;
    const P = v && i ? meanProduct(run.t, v, i, w) : null;
    const S = sv && si_ ? sv.rms * si_.rms : null;
    // Reactive power from the steady-state phasors (peak values: Q = ½ Im(V I*)).
    const ss = lab.info.ss as Steady | null;
    let Q: number | null = null;
    if (ss && v && i) {
      const V = ss.res.v[el.id], I = ss.res.i[el.id];
      Q = 0.5 * (V.im * I.re - V.re * I.im);
    }
    // Numerical noise (a mean of 1e-13 V on an AC signal) is shown as 0.
    const clean = (x: number, scale: number) => (Math.abs(x) < 1e-6 * Math.max(scale, 1e-30) ? 0 : x);
    if (sv) sv.mean = clean(sv.mean, sv.peak);
    if (si_) si_.mean = clean(si_.mean, si_.peak);
    const sc = S ?? 0;
    return { sv, si: si_, P: P === null ? null : clean(P, sc), S, Q: Q === null ? null : clean(Q, sc), pf: P !== null && S ? clean(P, sc) / S : null, periodic: !!f1 };
  });

  const STEPS = 1000;
  const toPos = (p: ElParam, v: number) => (p.scale === 'log' ? (STEPS * Math.log(Math.max(v, p.min) / p.min)) / Math.log(p.max / p.min) : (STEPS * (v - p.min)) / (p.max - p.min));
  const fromPos = (p: ElParam, x: number) => +(p.scale === 'log' ? p.min * (p.max / p.min) ** (x / STEPS) : p.min + ((p.max - p.min) * x) / STEPS).toPrecision(3);

  const SIG = [
    { id: 'v', unit: 'V', name: { fr: 'tension', en: 'voltage' } },
    { id: 'i', unit: 'A', name: { fr: 'courant', en: 'current' } },
    { id: 'p', unit: 'W', name: { fr: 'puissance', en: 'power' } },
  ];
  let copied = $state(false);
  async function share() {
    try {
      await navigator.clipboard.writeText(bench.shareUrl());
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      prompt(tr({ fr: 'Lien du projet :', en: 'Project link:' }), bench.shareUrl());
    }
  }
  function setTyped(p: ElParam, text: string) {
    const v = parseSI(text);
    if (v === null || !el) return;
    bench.checkpoint();
    bench.setParam(el.id, p.id, v);
  }
</script>

<section class="panel insp">
  <header>
    <span>{el ? `${el.id} — ${tr(def!.name)}` : sel?.kind === 'wire' ? tr({ fr: 'Fil', en: 'Wire' }) : nPicked > 1 ? tr({ fr: 'Sélection', en: 'Selection' }) : tr({ fr: 'Projet', en: 'Project' })}</span>
  </header>
  <div class="body">
    {#if el && def}
      {#each def.params as p (p.id)}
        {@const v = el.params[p.id] ?? p.default}
        <div class="param">
          <label for="p-{p.id}">{@html renderMath(p.symbol)} <span class="pn">{tr(p.name)}</span></label>
          <div class="row">
            <input id="p-{p.id}" type="range" onpointerdown={() => bench.checkpoint()} onkeydown={() => bench.checkpoint()} min="0" max={STEPS} value={toPos(p, v)} oninput={(e) => bench.setParam(el.id, p.id, fromPos(p, +e.currentTarget.value))} />
            <input class="num" type="text" value={si(v, p.unit)} onchange={(e) => setTyped(p, e.currentTarget.value)} aria-label={tr(p.name)} />
          </div>
        </div>
      {/each}
      {#if def.signals.length}
        <h4>{tr({ fr: 'Sur l’oscilloscope', en: 'On the oscilloscope' })}</h4>
        <div class="chips">
          {#each SIG.filter((s) => def.signals.includes(s.id as 'v')) as s (s.id)}
            <button class="chip" class:on={el.scope.includes(s.id)} onclick={() => bench.toggleScope(el.id, s.id)}>
              {s.id} : {si(lab.run.s[`${el.id}.${s.id}`]?.[lab.idx] ?? NaN, s.unit)}
            </button>
          {/each}
        </div>
      {/if}
      {#if meas}
        <h4>{tr({ fr: 'Mesures', en: 'Measurements' })} <span class="sub">({meas.periodic ? tr({ fr: 'dernières périodes', en: 'last periods' }) : tr({ fr: 'seconde moitié', en: 'second half' })})</span></h4>
        <dl class="meas">
          {#if meas.sv}
            <dt>V {tr({ fr: 'eff.', en: 'RMS' })}</dt><dd>{si(meas.sv.rms, 'V')}</dd>
            <dt>V {tr({ fr: 'moy. / crête', en: 'mean / peak' })}</dt><dd>{si(meas.sv.mean, 'V')} / {si(meas.sv.peak, 'V')}</dd>
          {/if}
          {#if meas.si}
            <dt>I {tr({ fr: 'eff.', en: 'RMS' })}</dt><dd>{si(meas.si.rms, 'A')}</dd>
            <dt>I {tr({ fr: 'moy. / crête', en: 'mean / peak' })}</dt><dd>{si(meas.si.mean, 'A')} / {si(meas.si.peak, 'A')}</dd>
          {/if}
          {#if meas.P !== null}
            <dt>P</dt><dd>{si(meas.P, 'W')}</dd>
            <dt>S</dt><dd>{si(meas.S ?? NaN, 'VA')}</dd>
            {#if meas.Q !== null}<dt>Q</dt><dd>{si(meas.Q, 'var')}</dd>{/if}
            {#if meas.pf !== null}<dt>cos φ</dt><dd>{meas.pf.toFixed(3)}</dd>{/if}
          {/if}
        </dl>
      {/if}
      <div class="acts">
        <button class="btn" onclick={() => bench.rotate(el.id)}>⟳ {tr({ fr: 'Tourner', en: 'Rotate' })} (R)</button>
        <button class="btn danger" onclick={() => bench.remove()}>✕ {tr({ fr: 'Supprimer', en: 'Delete' })}</button>
      </div>
    {:else if nPicked > 1}
      <p class="count">
        {bench.picked.els.length} {tr({ fr: 'élément(s)', en: 'element(s)' })}, {bench.picked.wires.length} {tr({ fr: 'fil(s)', en: 'wire(s)' })}
      </p>
      <p class="ids">{bench.picked.els.join(', ')}</p>
      <div class="acts">
        <button class="btn danger" onclick={() => bench.removePicked()}>✕ {tr({ fr: 'Effacer la sélection', en: 'Delete selection' })} (Suppr)</button>
        <button class="btn" onclick={() => (bench.selection = null)}>{tr({ fr: 'Désélectionner', en: 'Deselect' })} (Échap)</button>
      </div>
      <p class="help">{tr({ fr: 'Glissez l’un des éléments sélectionnés pour déplacer tout le groupe.', en: 'Drag any selected element to move the whole group.' })}</p>
    {:else if sel?.kind === 'wire'}
      <div class="acts"><button class="btn danger" onclick={() => bench.remove()}>✕ {tr({ fr: 'Supprimer le fil', en: 'Delete wire' })}</button></div>
    {:else}
      <div class="param">
        <label for="pname">{tr({ fr: 'Nom', en: 'Name' })}</label>
        <input id="pname" class="text" type="text" value={bench.doc.name} onchange={(e) => bench.rename(e.currentTarget.value)} />
      </div>
      <div class="param">
        <label for="pT">{tr({ fr: 'Durée simulée', en: 'Simulated time' })}</label>
        <input id="pT" class="text" type="text" value={si(bench.doc.T, 's')} onchange={(e) => {
          const v = parseSI(e.currentTarget.value);
          if (v && v > 0) (bench.checkpoint(), bench.setT(v));
        }} />
      </div>
      {#if bench.compiled.net.diagnostics.length}
        <h4>{tr({ fr: 'Messages', en: 'Messages' })}</h4>
        <ul class="diag">
          {#each bench.compiled.net.diagnostics as d, k (k)}<li class={d.level}>{tr(d.text)}</li>{/each}
        </ul>
      {/if}
      <h4>{tr({ fr: 'Modèles', en: 'Templates' })}</h4>
      <ul class="tpl">
        {#each TEMPLATES as t (t.id)}
          <li>
            <button class="link" onclick={() => (bench.load(t.doc()), setTimeout(onfit, 0))}>{tr(t.name)}</button>
            <span class="md">{@html renderMarkdown(tr(t.note))}</span>
          </li>
        {/each}
      </ul>
      <div class="acts">
        <button class="btn" onclick={share}>🔗 {copied ? tr({ fr: 'Lien copié', en: 'Link copied' }) : tr({ fr: 'Partager', en: 'Share' })}</button>
        <button class="btn" onclick={() => bench.load({ version: 1, name: tr({ fr: 'Sans titre', en: 'Untitled' }), elements: [], wires: [], T: 0.05 })}>＋ {tr({ fr: 'Nouveau', en: 'New' })}</button>
        <button class="btn" disabled={!bench.doc.elements.length} onclick={() => bench.selectAll()}>{tr({ fr: 'Tout sélectionner', en: 'Select all' })} (Ctrl+A)</button>
        <button class="btn danger" disabled={!bench.doc.elements.length && !bench.doc.wires.length} onclick={() => bench.clearAll()}>🗑 {tr({ fr: 'Tout effacer', en: 'Clear all' })}</button>
      </div>
      <p class="help">
        {tr({
          fr: 'Glisser : déplacer · glisser le fond : encadrer · Maj+clic : ajouter à la sélection · Ctrl+A : tout sélectionner · R : tourner · Suppr : effacer · Ctrl+Z / Ctrl+Y : annuler / rétablir · molette : zoom · bouton du milieu, Espace ou outil Vue : se déplacer.',
          en: 'Drag: move · drag the background: box select · Shift+click: add to selection · Ctrl+A: select all · R: rotate · Del: delete · Ctrl+Z / Ctrl+Y: undo / redo · wheel: zoom · middle button, Space or Pan tool: pan.',
        })}
      </p>
    {/if}
  </div>
</section>

<style>
  .insp .body {
    overflow-y: auto;
  }
  .param {
    margin-bottom: 8px;
  }
  label {
    display: block;
    font-size: 12px;
    margin-bottom: 2px;
  }
  .pn {
    color: var(--muted);
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .row input[type='range'] {
    flex: 1;
    min-width: 0;
  }
  .num,
  .text {
    font: 12px var(--mono, monospace);
    padding: 3px 6px;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--panel-2);
    color: var(--ink);
  }
  .num {
    width: 92px;
    text-align: right;
  }
  .text {
    width: 100%;
  }
  h4 {
    margin: 10px 0 4px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    font: 11.5px var(--mono, monospace);
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--muted);
  }
  .chip.on {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--ink);
  }
  .acts {
    display: flex;
    gap: 6px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  .danger {
    color: var(--warn);
  }
  .diag {
    margin: 0;
    padding-left: 16px;
    font-size: 12px;
  }
  .diag .warn,
  .diag .error {
    color: var(--warn);
  }
  .tpl {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 12px;
  }
  .tpl li {
    margin-bottom: 6px;
  }
  .tpl span {
    display: block;
    color: var(--muted);
    font-size: 11px;
  }
  .tpl .md :global(p) {
    margin: 0;
  }
  .link {
    border: none;
    background: none;
    padding: 0;
    color: var(--accent);
    font-weight: 600;
    text-align: left;
  }
  .meas {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1px 10px;
    margin: 0;
    font: 11.5px var(--mono, monospace);
  }
  .meas dt {
    font-weight: 700;
    color: var(--muted);
  }
  .meas dd {
    margin: 0;
  }
  .sub {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .count {
    margin: 0 0 4px;
    font-weight: 600;
    font-size: 13px;
  }
  .ids {
    margin: 0;
    font: 12px var(--mono, monospace);
    color: var(--muted);
  }
  .help {
    margin-top: 10px;
    font-size: 11px;
    color: var(--muted);
  }
</style>
