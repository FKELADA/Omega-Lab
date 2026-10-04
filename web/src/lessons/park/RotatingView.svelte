<script lang="ts">
  import type { Lab } from '../../lib/lab/lab.svelte';
  import SpacePlane from './SpacePlane.svelte';
  let { lab }: { lab: Lab } = $props();
</script>

<SpacePlane {lab} rotating />
