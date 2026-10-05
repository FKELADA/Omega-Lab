// The bench is shared with the dock's panels through a context, so they keep the
// instruments' { lab } signature and can be enlarged by Zoomable unchanged.
import { getContext, setContext } from 'svelte';
import type { Bench } from '../bench.svelte';

const KEY = Symbol('bench');
export const provideBench = (b: Bench) => setContext(KEY, b);
export const useBench = () => getContext<Bench>(KEY);
