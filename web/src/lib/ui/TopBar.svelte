<script lang="ts">
  import type { Experiment } from '../lab/types';
  import { S, savePrefs, tr, ui, type Persona, type Theme } from './ui.svelte';

  let { exp, onmap, ondocs, docs = false }: { exp: Experiment; onmap: () => void; ondocs: () => void; docs?: boolean } = $props();

  const personas: Persona[] = ['learner', 'research', 'utility'];
  const themes: Theme[] = ['auto', 'light', 'dark'];
  const themeIcon: Record<Theme, string> = { auto: '◐', light: '☀', dark: '☾' };

  const set = <K extends 'lang' | 'persona' | 'theme'>(k: K, v: (typeof ui)[K]) => {
    ui[k] = v;
    savePrefs();
  };
</script>

<header class="top">
  <div class="brand">
    <svg viewBox="0 0 32 32" aria-hidden="true" class="logo">
      <circle cx="16" cy="16" r="14" />
      <path d="M4,16 C8,4 12,4 16,16 S24,28 28,16" />
      <line x1="16" y1="16" x2="25.9" y2="6.1" />
    </svg>
    <div>
      <div class="name">Omega Lab</div>
      <div class="tag">{tr(S.tagline)}</div>
    </div>
  </div>

  <button class="crumbs" onclick={onmap} title={tr(S.modules)}>
    <span class="map">☰</span>
    {#each exp.path as p (p.en)}<span class="crumb">{tr(p)}</span><span class="sep">›</span>{/each}
    <span class="crumb cur">{tr(exp.title)}</span>
  </button>

  <div class="controls">
    <button class="btn" class:on={docs} onclick={ondocs} title="Documentation">📖 Documentation</button>
    <div class="seg" role="group" aria-label={tr(S.persona)}>
      {#each personas as p (p)}
        <button class:on={ui.persona === p} onclick={() => set('persona', p)}>{tr(S[p])}</button>
      {/each}
    </div>
    <div class="seg" role="group" aria-label="Language">
      <button class:on={ui.lang === 'fr'} onclick={() => set('lang', 'fr')}>FR</button>
      <button class:on={ui.lang === 'en'} onclick={() => set('lang', 'en')}>EN</button>
    </div>
    <button
      class="btn icon"
      title="{tr(S.theme)}: {ui.theme}"
      onclick={() => set('theme', themes[(themes.indexOf(ui.theme) + 1) % 3])}>{themeIcon[ui.theme]}</button
    >
  </div>
</header>

<style>
  .top {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 8px 16px;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
    flex-wrap: wrap;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    width: 32px;
    height: 32px;
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.2;
    stroke-linecap: round;
  }
  .name {
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -0.01em;
    line-height: 1.1;
  }
  .tag {
    font-size: 11px;
    color: var(--muted);
  }
  .crumbs {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--line);
    background: var(--panel-2);
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 13px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
  }
  .crumbs:hover {
    border-color: var(--accent);
  }
  .map {
    color: var(--accent);
  }
  .crumb {
    color: var(--muted);
  }
  .crumb.cur {
    color: var(--ink);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sep {
    color: var(--faint);
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .seg {
    display: inline-flex;
    border: 1px solid var(--line);
    border-radius: 8px;
    overflow: hidden;
  }
  .seg button {
    border: none;
    background: var(--panel);
    padding: 4px 10px;
    font-size: 12.5px;
    color: var(--muted);
  }
  .seg button + button {
    border-left: 1px solid var(--line);
  }
  .seg button.on {
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 600;
  }
  .icon {
    width: 32px;
    justify-content: center;
  }
  @media (max-width: 760px) {
    .crumbs {
      order: 3;
      flex-basis: 100%;
    }
  }
</style>
