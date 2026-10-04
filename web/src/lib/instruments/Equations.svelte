<script lang="ts">
  import type { Lab } from '../lab/lab.svelte';
  import type { EqContext } from '../lab/types';
  import { S, tr, ui } from '../ui/ui.svelte';
  import { time, tex } from '../ui/format';
  import { renderMarkdown, renderMath } from '../ui/markdown';

  let { lab }: { lab: Lab } = $props();

  let open = $state<Record<string, boolean>>({});

  const ctx: EqContext = $derived({
    p: lab.params,
    k: lab.info,
    at: (s: string) => lab.at(s),
    t: lab.t,
    term: (id: string, body: string) => `\\htmlClass{eqt eqt-${id}}{${body}}`,
    q: (v: number, unit: string, digits?: number) => (void ui.lang, tex(v, unit, digits)),
    tr,
  });

  const shown = $derived(lab.exp.equations.filter((e) => !e.personas || e.personas.includes(ui.persona)));

  function onOver(e: MouseEvent) {
    const el = (e.target as Element).closest('[class*="eqt-"]');
    const cls = el ? [...el.classList].find((c) => c.startsWith('eqt-')) : undefined;
    lab.hover = cls ? cls.slice(4) : null;
  }
</script>

<section class="panel eqs">
  <header>
    <span>{tr(S.equations)}</span>
    <span class="spacer"></span>
    <span class="t">{lab.exp.axis?.symbol ?? 't'} = {lab.fmtT(lab.t)}</span>
  </header>
  {#if lab.concealed}<div class="concealed">{tr(S.hiddenUntilReveal)}</div>{/if}
  <div class="body scroll" role="presentation" onmouseover={onOver} onfocus={() => {}} onmouseleave={() => (lab.hover = null)}>
    {#each shown as eq (eq.id)}
      <article>
        <h3>
          {tr(eq.title)}
          {#if eq.derive}
            <button class="derive" class:on={open[eq.id]} onclick={() => (open[eq.id] = !open[eq.id])}>
              {open[eq.id] ? '▾' : '▸'} {tr(S.derive)}
            </button>
          {/if}
        </h3>
        <div class="math">{@html renderMath(eq.tex(ctx), true)}</div>

        {#if eq.bars}
          {@const b = eq.bars(ctx)}
          <div class="bars">
            {#each b.items as it, j (j)}
              {@const w = Math.min(50, (50 * Math.abs(it.value)) / (b.scale || 1))}
              <div class="row" data-term={it.term}>
                <span class="sym">{@html renderMath(it.label)}</span>
                <div class="track">
                  <div class="zero"></div>
                  <div
                    class="fill"
                    style="background: var(--c-{it.term}); width: {w}%; {it.value >= 0 ? 'left: 50%' : `left: ${50 - w}%`}"
                  ></div>
                </div>
                <span class="num">{Math.round((100 * it.value) / (b.scale || 1))} %</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if eq.derive && open[eq.id]}
          <ol class="steps">
            {#each eq.derive(ctx) as line, k (k)}
              <li>{@html renderMath(line, true)}</li>
            {/each}
          </ol>
        {/if}

        {#if eq.note}
          {@const n = eq.note(ctx)}
          {#if n}<div class="note">{@html renderMarkdown(n)}</div>{/if}
        {/if}
      </article>
    {/each}
  </div>
</section>

<style>
  .scroll {
    overflow-y: auto;
  }
  .t {
    font-family: var(--mono);
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  article {
    padding: 4px 0 12px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 10px;
  }
  article:last-child {
    border-bottom: none;
  }
  h3 {
    margin: 0 0 2px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .derive {
    border: none;
    background: none;
    color: var(--accent);
    font-size: 12px;
    padding: 0;
    margin-left: auto;
  }
  .math {
    font-size: 14px;
  }
  .bars {
    display: grid;
    gap: 3px;
    margin: 4px 0;
  }
  .row {
    display: grid;
    grid-template-columns: 34px 1fr 46px;
    align-items: center;
    gap: 8px;
    border-radius: 4px;
    padding: 0 4px;
  }
  .sym {
    font-size: 12px;
  }
  .track {
    position: relative;
    height: 10px;
    background: var(--panel-2);
    border-radius: 3px;
  }
  .zero {
    position: absolute;
    left: 50%;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: var(--faint);
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 2px;
  }
  .num {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--muted);
    text-align: right;
  }
  .steps {
    margin: 4px 0;
    padding-left: 22px;
    background: var(--panel-2);
    border-radius: 6px;
    font-size: 13px;
  }
  .note {
    font-size: 12.5px;
    color: var(--muted);
  }
  .note :global(p) {
    margin: 2px 0;
  }
</style>
