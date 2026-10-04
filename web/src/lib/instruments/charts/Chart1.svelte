<script lang="ts">
  // Shows the experiment's chart number 1 (see ChartSpec).
  import type { Lab } from '../../lab/lab.svelte';
  import XYChart from '../XYChart.svelte';
  let { lab }: { lab: Lab } = $props();
</script>

<XYChart {lab} index={1} />
