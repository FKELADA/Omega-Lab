<script lang="ts">
  // Live link to a local G2ELin API: pick one of its networks, list the
  // electromechanical modes of the full model, draw a mode shape as a compass,
  // and plot a free response. Offline, explains how to start the API.
  import type { Lab } from '../../lib/lab/lab.svelte';
  import { freeKey, g2, g2Check, g2Free, g2Modal, g2Shape, ready, shapeKey } from '../../lib/models/g2elin.svelte';
  import { tr } from '../../lib/ui/ui.svelte';
  import { num } from '../../lib/ui/format';

  // The panel talks to G2ELin directly; it does not read the lesson's lab.
  let {}: { lab: Lab } = $props();
  let preset = $state('');
  let mode = $state<number | null>(null);
  let sm = $state(1);

  $effect(() => g2Check());
  $effect(() => {
    if (g2.status === 'ok' && !preset && g2.presets.length) preset = g2.presets[0].id;
  });
  $effect(() => {
    if (g2.status === 'ok' && preset) g2Modal(preset);
  });
  const modal = $derived(preset ? ready(g2.modal[preset]) : null);
  const modalSlot = $derived(preset ? g2.modal[preset] : undefined);
  $effect(() => {
    if (modal && mode === null && modal.em.length) mode = modal.em[0].index;
  });
  $effect(() => {
    if (preset && mode !== null) g2Shape(preset, mode);
  });
  const shape = $derived(preset && mode !== null ? ready(g2.shape[shapeKey(preset, mode)]) : null);
  const free = $derived(preset ? ready(g2.free[freeKey(preset, sm)]) : null);

  /** dw_r_{SM_3} → SM 3 (G2ELin state names). */
  const pretty = (s: string) => s.replace(/^(?:dw_r_|d_r_|delta_)?\{?([A-Za-z]+)_(\d+)\}?$/, '$1 $2');

  function pick(id: string) {
    preset = id;
    mode = null;
  }

  // Free-response sparkline.
  const FW = 340, FH = 90;
  const freePaths = $derived.by(() => {
    if (!free || !free.t.length) return [];
    const keys = Object.keys(free.series);
    const all = keys.flatMap((k) => free.series[k]).filter(isFinite);
    const A = Math.max(1e-12, ...all.map(Math.abs));
    const t1 = free.t[free.t.length - 1] || 1;
    return keys.map((k, j) => ({
      key: k,
      color: `var(${['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i'][j % 6]})`,
      d: free.t.map((t, i) => `${i ? 'L' : 'M'}${((t / t1) * FW).toFixed(1)},${(FH / 2 - (free.series[k][i] / A) * (FH / 2 - 4)).toFixed(1)}`).join(''),
    }));
  });
  const COLORS = ['--c-p', '--c-R', '--c-S', '--c-C', '--c-L', '--c-i'];
</script>

<section class="panel">
  <header>
    <span>{tr({ fr: 'Réseaux réels avec G2ELin', en: 'Real networks with G2ELin' })}</span>
    <span class="spacer"></span>
    <span class="st" class:ok={g2.status === 'ok'}>{g2.status === 'ok' ? tr({ fr: 'connecté', en: 'connected' }) : g2.status === 'checking' ? '…' : tr({ fr: 'hors ligne', en: 'offline' })}</span>
  </header>
  <div class="body">
    {#if g2.status === 'offline' || g2.status === 'idle'}
      <p class="note">
        {tr({
          fr: 'L’API G2ELin ne répond pas. Lancez-la sur votre machine (start-windows.bat, port 8000), puis réessayez. Pour un autre serveur, définissez VITE_G2ELIN_URL. En attendant, le modèle à quatre machines ci-dessus fonctionne dans le navigateur.',
          en: 'The G2ELin API is not responding. Start it on your machine (start-windows.bat, port 8000), then retry. For another server, set VITE_G2ELIN_URL. Meanwhile, the four-machine model above runs in the browser.',
        })}
      </p>
      <button class="btn" onclick={() => g2Check(true)}>{tr({ fr: 'Réessayer', en: 'Retry' })}</button>
    {:else if g2.status === 'ok'}
      <div class="row">
        {#each g2.presets as p (p.id)}
          <button class="chip" class:on={p.id === preset} onclick={() => pick(p.id)}>{p.name}</button>
        {/each}
      </div>
      {#if modalSlot === 'loading'}
        <p class="note">{tr({ fr: 'Analyse modale en cours…', en: 'Running modal analysis…' })}</p>
      {:else if modalSlot === 'error'}
        <p class="note warn">{tr({ fr: 'L’analyse modale a échoué pour ce réseau.', en: 'Modal analysis failed for this network.' })}</p>
      {:else if modal}
        <p class="note">
          {modal.nStates} {tr({ fr: 'états', en: 'states' })} · {modal.stable ? tr({ fr: 'stable', en: 'stable' }) : tr({ fr: 'instable', en: 'unstable' })} · {modal.em.length} {tr({ fr: 'modes électromécaniques (0,1–3 Hz)', en: 'electromechanical modes (0.1–3 Hz)' })}
        </p>
        <table>
          <thead><tr><th>f (Hz)</th><th>ζ (%)</th><th>{tr({ fr: 'états dominants', en: 'dominant states' })}</th></tr></thead>
          <tbody>
            {#each modal.em as m (m.index)}
              <tr class:sel={m.index === mode} class:weak={m.damping < 5}>
                <td><button class="link" onclick={() => (mode = m.index)}>{num(m.freq, 3)}</button></td><td>{num(m.damping, 3)}</td><td class="states">{m.states.map(pretty).join(', ')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        {#if shape}
          <svg viewBox="-60 -60 120 120" class="compass" role="img" aria-label="Mode shape">
            <circle r="50" class="ring" />
            {#each shape.states as s, j (s)}
              {@const a = (shape.angles[j] * Math.PI) / 180}
              <line x2={46 * Math.cos(a)} y2={-46 * Math.sin(a)} style="stroke: var({COLORS[j % 6]})" class="arm" />
              <text x={54 * Math.cos(a)} y={-54 * Math.sin(a) + 3} class="sl">{pretty(s)}</text>
            {/each}
          </svg>
          <p class="note">{tr({ fr: 'Forme du mode : les machines en opposition de phase oscillent les unes contre les autres.', en: 'Mode shape: machines in phase opposition swing against each other.' })}</p>
        {/if}
        <div class="row">
          <label>{tr({ fr: 'Réponse libre après un choc sur la machine', en: 'Free response after a kick on machine' })}
            <input type="number" min="1" max="20" bind:value={sm} />
          </label>
          <button class="btn" onclick={() => g2Free(preset, sm)}>{tr({ fr: 'Simuler', en: 'Simulate' })}</button>
        </div>
        {#if freePaths.length}
          <svg viewBox="0 0 {FW} {FH}" class="free" role="img" aria-label="Free response">
            <line x1="0" y1={FH / 2} x2={FW} y2={FH / 2} class="ring" />
            {#each freePaths as f (f.key)}<path d={f.d} style="stroke: {f.color}" class="tr" />{/each}
          </svg>
        {/if}
      {/if}
    {:else}
      <p class="note">{tr({ fr: 'Recherche de l’API G2ELin…', en: 'Looking for the G2ELin API…' })}</p>
    {/if}
  </div>
</section>

<style>
  .body {
    max-height: 340px;
    overflow-y: auto;
  }
  .st {
    text-transform: none;
    color: var(--muted);
  }
  .st.ok {
    color: var(--good);
    font-weight: 700;
  }
  .note {
    margin: 4px 0;
    font-size: 12px;
    color: var(--muted);
  }
  .note.warn {
    color: var(--warn);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin: 6px 0;
    font-size: 12px;
  }
  .chip,
  .btn {
    font: inherit;
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--panel-2);
    color: var(--ink);
    cursor: pointer;
  }
  .chip.on {
    background: var(--accent);
    color: var(--panel);
    border-color: var(--accent);
  }
  input {
    width: 4em;
    margin-left: 4px;
    font: inherit;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    font-family: var(--mono);
  }
  th {
    text-align: left;
    color: var(--muted);
    font-weight: 600;
  }
  td,
  th {
    padding: 2px 6px;
    border-bottom: 1px solid var(--line);
  }
  .link {
    font: inherit;
    border: none;
    background: none;
    padding: 0;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }
  tr.sel td {
    background: var(--accent-soft);
  }
  tr.weak td:nth-child(2) {
    color: var(--warn);
    font-weight: 700;
  }
  .states {
    font-size: 11px;
    word-break: break-all;
  }
  .compass {
    width: 180px;
    display: block;
    margin: 6px auto 0;
  }
  .free {
    width: 100%;
    height: auto;
    display: block;
  }
  .ring {
    fill: none;
    stroke: var(--line);
  }
  .arm {
    stroke-width: 2.2;
  }
  .sl {
    fill: var(--ink);
    font-size: 7px;
    text-anchor: middle;
  }
  .tr {
    fill: none;
    stroke-width: 1.4;
  }
</style>
