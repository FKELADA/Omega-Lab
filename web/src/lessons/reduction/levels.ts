import type { L } from '../../lib/ui/ui.svelte';

/** What each model level drops compared with the one above it. */
export const REMOVED: Record<string, L> = {
  emt: { fr: 'Tout : courants et tensions instantanés du réseau, flux du stator.', en: 'Everything: instantaneous network currents and voltages, stator fluxes.' },
  rms: { fr: 'Réseau en phaseurs (quasi-stationnaire) : plus de transitoires à 50 Hz.', en: 'Network as phasors (quasi-stationary): no more 50 Hz transients.' },
  o6: { fr: 'Plus de flux statoriques : flux subtransitoires d et q seulement.', en: 'No stator fluxes: sub-transient d and q fluxes only.' },
  o4: { fr: 'Plus d’amortisseurs : flux transitoires E′d, E′q.', en: 'No damper windings: transient fluxes E′d, E′q.' },
  o3: { fr: 'Flux d’excitation E′q seul.', en: 'Field flux E′q only.' },
  o2: { fr: 'F.é.m. constante derrière X′d : l’excitation (AVR, PSS) n’agit plus.', en: 'Constant EMF behind X′d: excitation (AVR, PSS) no longer acts.' },
};
