// Hints and full explanations for every guided step, one file per module, keyed
// by experiment id then step id. The hint is offered while the learner works on
// the step; the explanation (with its formula) appears once the step is done.

import type { L } from '../../lib/ui/ui.svelte';
import { answers0 } from './m0';
import { answers1 } from './m1';
import { answers2 } from './m2';
import { answers3 } from './m3';
import { answers4 } from './m4';
import { answers4b } from './m4b';
import { answers5 } from './m5';
import { answers6 } from './m6';
import { answers7 } from './m7';
import { answers8 } from './m8';
import { answers8b } from './m8b';
import { answers9 } from './m9';
import { answers10 } from './m10';

export interface StepHelp {
  hint: L;
  answer: L;
}
export type Answers = Record<string, Record<string, StepHelp>>;

export const answers: Answers = { ...answers0, ...answers1, ...answers2, ...answers3, ...answers4, ...answers4b, ...answers5, ...answers6, ...answers7, ...answers8, ...answers8b, ...answers9, ...answers10 };
