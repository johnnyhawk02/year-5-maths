import type { SkillContent } from '../engine/types';
import { ADD_SUBTRACT_SKILLS } from './add-subtract';
import { FRACTION_SKILLS } from './fractions';
import { MULTIPLY_DIVIDE_SKILLS } from './multiply-divide';
import { PLACE_VALUE_SKILLS } from './place-value';

const ALL: SkillContent[] = [...PLACE_VALUE_SKILLS, ...ADD_SUBTRACT_SKILLS, ...MULTIPLY_DIVIDE_SKILLS, ...FRACTION_SKILLS];
const BY_ID = new Map(ALL.map((s) => [s.id, s]));

export const getSkillContent = (id: string): SkillContent | undefined => BY_ID.get(id);
export const hasContent = (id: string): boolean => BY_ID.has(id);
export const ALL_CONTENT = ALL;
