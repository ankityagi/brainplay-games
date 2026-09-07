import { TemplateId } from './templates';

export interface CodingStageConfig {
  templates: TemplateId[];
  timePerQuestion: number;
  questions: number;
}

export const CODING_STAGES: CodingStageConfig[] = [
  { templates: ['assign'], timePerQuestion: 25, questions: 10 },
  { templates: ['assign', 'ifelse'], timePerQuestion: 24, questions: 10 },
  { templates: ['ifelse', 'array'], timePerQuestion: 23, questions: 10 },
  { templates: ['array', 'forsum'], timePerQuestion: 22, questions: 10 },
  { templates: ['forsum', 'while'], timePerQuestion: 21, questions: 10 },
  { templates: ['while', 'strlen'], timePerQuestion: 20, questions: 10 },
  { templates: ['nested', 'func'], timePerQuestion: 20, questions: 10 },
  { templates: ['func', 'evensum'], timePerQuestion: 19, questions: 10 },
  { templates: ['evensum', 'divcount'], timePerQuestion: 18, questions: 10 },
  {
    templates: ['forsum', 'while', 'nested', 'func', 'evensum', 'divcount'],
    timePerQuestion: 17,
    questions: 10,
  },
];
