<script lang="ts">
  // Marks its children as drawn in the enlarged window (see Zoomable), so charts
  // can use a larger drawing area instead of simply magnifying their text.
  import { setContext, type Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  setContext('zoomed', true);
</script>

{@render children()}
