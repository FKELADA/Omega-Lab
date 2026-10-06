<script lang="ts">
  // The home page: what Omega Lab is, where to start by profile, the course map with the
  // viewer's progress, and the way into the Atelier.
  import { curriculum, lessons } from '../../lessons/curriculum';
  import { doneChallenges } from '../../atelier/done';
  import { doneIn, progress, resetProgress } from './progress.svelte';
  import { S, savePrefs, tr, ui, type L, type Persona } from './ui.svelte';

  let { onnote }: { onnote: (module: number) => void } = $props();

  const mods = curriculum.filter((m) => m.lessons.some((l) => l.experiment));
  const nLessons = lessons.length;
  const nSteps = lessons.reduce((a, l) => a + l.experiment!.steps.length, 0);

  const stepsOf = (l: (typeof lessons)[number]) => l.experiment!.steps.map((s) => s.id);
  const lessonDone = (l: (typeof lessons)[number]) => doneIn(l.experiment!.id, stepsOf(l));
  const modDone = (m: (typeof mods)[number]) => {
    const ls = m.lessons.filter((l) => l.experiment);
    const done = ls.reduce((a, l) => a + lessonDone(l), 0);
    const all = ls.reduce((a, l) => a + l.experiment!.steps.length, 0);
    return { done, all, frac: all ? done / all : 0 };
  };
  const totalDone = $derived(lessons.reduce((a, l) => a + lessonDone(l), 0));
  const last = $derived(lessons.find((l) => l.experiment!.id === progress.last));
  const challenges = doneChallenges().length;

  const PROFILES: { id: Persona; icon: string; title: L; text: L; path: L; start: string }[] = [
    {
      id: 'learner',
      icon: '🎓',
      title: S.learner,
      text: {
        fr: 'Partir du circuit RLC et monter jusqu’au réseau : prédire, manipuler, comprendre.',
        en: 'Start from the RLC circuit and climb to the grid: predict, play, understand.',
      },
      path: { fr: 'Modules 0 → 1 → 2 → 3 → 4', en: 'Modules 0 → 1 → 2 → 3 → 4' },
      start: '0.1',
    },
    {
      id: 'research',
      icon: '🔬',
      title: S.research,
      text: {
        fr: 'Les modèles, leurs hypothèses et leurs limites : commande, électronique de puissance, stabilité.',
        en: 'The models, their assumptions and limits: control, power electronics, stability.',
      },
      path: { fr: 'Modules 3 → 7 → 8', en: 'Modules 3 → 7 → 8' },
      start: '3.1',
    },
    {
      id: 'utility',
      icon: '🏗',
      title: S.utility,
      text: {
        fr: 'Le métier : éléments du réseau, études en régime permanent, gestionnaires de transport et de distribution.',
        en: 'The trade: grid elements, steady-state studies, transmission and distribution operators.',
      },
      path: { fr: 'Modules 4 → 5 → 9 → 10', en: 'Modules 4 → 5 → 9 → 10' },
      start: '4.1',
    },
  ];
  function startAs(p: (typeof PROFILES)[number]) {
    ui.persona = p.id;
    savePrefs();
    location.hash = p.start;
  }

  // The demo: a rotating phasor drawing its sine wave (still when motion is reduced).
  let phase = $state(0.6);
  $effect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, t0 = performance.now();
    const tick = (t: number) => {
      phase = 0.6 + ((t - t0) / 1000) * 1.4;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  });
  const R = 46, CX = 70, CY = 70;
  const wave = $derived.by(() => {
    const pts: string[] = [];
    for (let k = 0; k <= 120; k++) pts.push(`${140 + k * 2},${CY - R * Math.sin(phase - k * 0.06)}`);
    return pts.join(' ');
  });
  const wave2 = $derived.by(() => {
    const pts: string[] = [];
    for (let k = 0; k <= 120; k++) pts.push(`${140 + k * 2},${CY - 0.6 * R * Math.sin(phase - 1.1 - k * 0.06)}`);
    return pts.join(' ');
  });
  const tip = $derived([CX + R * Math.cos(phase), CY - R * Math.sin(phase)]);
  const tip2 = $derived([CX + 0.6 * R * Math.cos(phase - 1.1), CY - 0.6 * R * Math.sin(phase - 1.1)]);
</script>

<div class="home">
  <section class="hero">
    <div class="pitch">
      <h1>Omega Lab</h1>
      <p class="tag">{tr(S.tagline)}</p>
      <p class="lead">
        {tr({
          fr: 'Un laboratoire interactif d’électrotechnique et de réseaux électriques : chaque leçon est une expérience vivante, où l’on prédit, manipule, et voit les équations bouger avec le modèle.',
          en: 'An interactive laboratory for electrical engineering and power systems: every lesson is a live experiment where you predict, play, and watch the equations move with the model.',
        })}
      </p>
      <div class="cta">
        {#if last}
          <a class="btn primary" href="#{last.id}">▶ {tr({ fr: 'Reprendre', en: 'Resume' })} · {last.id} {tr(last.title)}</a>
          <a class="btn" href="#0.1">{tr({ fr: 'Recommencer au début', en: 'Start from the beginning' })}</a>
        {:else}
          <a class="btn primary" href="#0.1">▶ {tr({ fr: 'Commencer', en: 'Start' })} · 0.1 {tr(lessons[0].title)}</a>
        {/if}
        <a class="btn" href="#atelier">🛠 {tr({ fr: 'Ouvrir l’Atelier', en: 'Open the Workbench' })}</a>
        <a class="btn" href="#docs">📖 Documentation</a>
      </div>
      <ul class="stats">
        <li><b>{mods.length}</b> {tr({ fr: 'modules', en: 'modules' })}</li>
        <li><b>{nLessons}</b> {tr({ fr: 'leçons', en: 'lessons' })}</li>
        <li><b>{nSteps}</b> {tr({ fr: 'étapes guidées', en: 'guided steps' })}</li>
        <li><b>FR · EN</b></li>
      </ul>
    </div>
    <svg class="demo" viewBox="0 0 390 140" role="img" aria-label={tr({ fr: 'Un phaseur tournant trace sa sinusoïde', en: 'A rotating phasor draws its sine wave' })}>
      <circle cx={CX} cy={CY} r={R} class="unit" />
      <line x1={CX - R - 8} y1={CY} x2={390} y2={CY} class="axis" />
      <line x1={CX} y1={CY - R - 8} x2={CX} y2={CY + R + 8} class="axis" />
      <polyline points={wave2} class="w2" />
      <polyline points={wave} class="w1" />
      <line x1={CX} y1={CY} x2={tip2[0]} y2={tip2[1]} class="ph2" />
      <line x1={CX} y1={CY} x2={tip[0]} y2={tip[1]} class="ph1" />
      <line x1={tip[0]} y1={tip[1]} x2="140" y2={tip[1]} class="proj" />
      <circle cx={tip[0]} cy={tip[1]} r="3.5" class="dot1" />
      <text x="140" y="134" class="lbl">v(t) = V cos(ωt + φ)</text>
    </svg>
  </section>

  <section>
    <h2>{tr({ fr: 'Par où commencer ?', en: 'Where to start?' })}</h2>
    <div class="profiles">
      {#each PROFILES as p (p.id)}
        <button class="profile" class:on={ui.persona === p.id} onclick={() => startAs(p)}>
          <span class="icon">{p.icon}</span>
          <b>{tr(p.title)}</b>
          <span class="txt">{tr(p.text)}</span>
          <span class="path">{tr(p.path)} →</span>
        </button>
      {/each}
    </div>
  </section>

  <section>
    <div class="row">
      <h2>{tr({ fr: 'Le parcours', en: 'The course' })}</h2>
      <span class="spacer"></span>
      <span class="mine">{tr({ fr: 'Ma progression', en: 'My progress' })} : <b>{totalDone}</b> / {nSteps} {tr({ fr: 'étapes', en: 'steps' })}</span>
      {#if totalDone > 0}
        <button class="link" onclick={() => confirm(tr({ fr: 'Effacer la progression enregistrée dans ce navigateur ?', en: 'Clear the progress saved in this browser?' })) && resetProgress()}>{tr({ fr: 'effacer', en: 'clear' })}</button>
      {/if}
    </div>
    <div class="mods">
      {#each mods as m (m.n)}
        {@const p = modDone(m)}
        <article class="mod">
          <header>
            <span class="n">{m.n}</span>
            <b>{tr(m.title)}</b>
            <button class="info" title={tr({ fr: 'Note pédagogique', en: 'Teaching note' })} aria-label="{tr({ fr: 'Note pédagogique', en: 'Teaching note' })} — module {m.n}" onclick={() => onnote(m.n)}>ⓘ</button>
          </header>
          <div class="bar" title="{p.done} / {p.all}"><i style="width: {100 * p.frac}%"></i></div>
          <ul>
            {#each m.lessons.filter((l) => l.experiment) as l (l.id)}
              {@const d = lessonDone(l)}
              {@const n = l.experiment!.steps.length}
              <li>
                <a href="#{l.id}" class:done={d === n} class:started={d > 0 && d < n}>
                  <span class="id">{l.id}</span>
                  <span class="t">{tr(l.title)}</span>
                  <span class="st">{d === n ? '✓' : d > 0 ? `${d}/${n}` : ''}</span>
                </a>
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  </section>

  <section class="atelier">
    <div>
      <h2>🛠 {tr({ fr: 'L’Atelier', en: 'The Workbench' })}</h2>
      <p>
        {tr({
          fr: 'Un banc libre : posez des composants (RLC, électronique de puissance, lignes, machines, onduleurs, blocs de commande), câblez, simulez, et analysez à l’oscilloscope, en Bode, en impédance, en phaseurs, en pôles et en harmoniques. Des défis vous attendent.',
          en: 'A free bench: place components (RLC, power electronics, lines, machines, inverters, control blocks), wire them, simulate, and analyse with the oscilloscope, Bode, impedance, phasors, poles and harmonics. Challenges are waiting.',
        })}
      </p>
      <p class="mine">{tr({ fr: 'Défis réussis', en: 'Challenges met' })} : <b>{challenges}</b></p>
    </div>
    <a class="btn primary" href="#atelier">{tr({ fr: 'Ouvrir l’Atelier', en: 'Open the Workbench' })} →</a>
  </section>

  <footer>
    {tr({
      fr: 'Les chiffres « métier » (RTE, Enedis, ENTSO-E) sont des ordres de grandeur pédagogiques : voir le tableau des sources dans la documentation. La progression est enregistrée dans ce navigateur uniquement.',
      en: 'Industry figures (RTE, Enedis, ENTSO-E) are teaching orders of magnitude: see the sources table in the documentation. Progress is saved in this browser only.',
    })}
  </footer>
</div>

<style>
  .home {
    overflow-y: auto;
    padding: 18px max(16px, calc((100vw - 1240px) / 2)) 40px;
    min-height: 0;
  }
  section {
    margin-bottom: 26px;
  }
  h1 {
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.01em;
  }
  h2 {
    font-size: 18px;
    margin: 0 0 10px;
  }
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 24px;
    align-items: center;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 22px 24px;
  }
  .tag {
    margin: 2px 0 10px;
    color: var(--accent);
    font-weight: 600;
  }
  .lead {
    margin: 0 0 14px;
    line-height: 1.5;
  }
  .cta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn {
    display: inline-block;
    padding: 7px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--panel-2);
    color: var(--ink);
    text-decoration: none;
    font-size: 14px;
  }
  .btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
  .stats {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 0;
    margin: 16px 0 0;
    color: var(--muted);
    font-size: 14px;
  }
  .stats b {
    color: var(--ink);
    font-size: 18px;
  }
  .demo {
    width: 100%;
    height: auto;
  }
  .unit {
    fill: none;
    stroke: var(--line);
  }
  .axis {
    stroke: var(--line);
  }
  .w1 {
    fill: none;
    stroke: var(--c-S);
    stroke-width: 2.5;
  }
  .w2 {
    fill: none;
    stroke: var(--c-i);
    stroke-width: 2;
    opacity: 0.8;
  }
  .ph1 {
    stroke: var(--c-S);
    stroke-width: 3;
  }
  .ph2 {
    stroke: var(--c-i);
    stroke-width: 2.4;
  }
  .proj {
    stroke: var(--muted);
    stroke-dasharray: 3 3;
  }
  .dot1 {
    fill: var(--c-S);
  }
  .lbl {
    fill: var(--muted);
    font-size: 11px;
    font-family: var(--mono);
  }
  .profiles {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }
  .profile {
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: left;
    padding: 14px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--panel);
    color: var(--ink);
    cursor: pointer;
    font: inherit;
  }
  .profile:hover,
  .profile.on {
    border-color: var(--accent);
  }
  .icon {
    font-size: 22px;
  }
  .txt {
    color: var(--muted);
    font-size: 13.5px;
    line-height: 1.4;
  }
  .path {
    color: var(--accent);
    font-size: 13px;
    margin-top: auto;
  }
  .row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-wrap: wrap;
  }
  .spacer {
    flex: 1;
  }
  .mine {
    color: var(--muted);
    font-size: 13.5px;
  }
  .link {
    border: none;
    background: none;
    color: var(--accent);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    padding: 0;
  }
  .mods {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .mod {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px 14px;
  }
  .mod header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14.5px;
  }
  .n {
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
    font-weight: 700;
    flex: none;
  }
  .info {
    margin-left: auto;
    border: none;
    background: none;
    color: var(--muted);
    cursor: pointer;
    font-size: 15px;
  }
  .bar {
    height: 5px;
    border-radius: 3px;
    background: var(--panel-2);
    margin: 8px 0 6px;
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    background: var(--good, var(--accent));
  }
  .mod ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .mod a {
    display: flex;
    gap: 8px;
    padding: 3px 4px;
    border-radius: 6px;
    color: var(--ink);
    text-decoration: none;
    font-size: 13.5px;
  }
  .mod a:hover {
    background: var(--panel-2);
  }
  .id {
    color: var(--muted);
    font-family: var(--mono);
    min-width: 34px;
  }
  .t {
    flex: 1;
  }
  .st {
    color: var(--muted);
    font-size: 12px;
  }
  .mod a.done .st {
    color: var(--good, var(--accent));
    font-weight: 700;
  }
  .atelier {
    display: flex;
    gap: 18px;
    align-items: center;
    justify-content: space-between;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px 20px;
  }
  .atelier p {
    margin: 0 0 6px;
    line-height: 1.5;
    max-width: 760px;
  }
  footer {
    color: var(--muted);
    font-size: 12.5px;
  }
  @media (max-width: 760px) {
    .hero {
      grid-template-columns: minmax(0, 1fr);
      padding: 16px;
    }
    h1 {
      font-size: 28px;
    }
    .atelier {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
