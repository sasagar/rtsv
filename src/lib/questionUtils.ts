import { QuestionType } from '@/types';

/**
 * Returns a user-friendly label for a given question type.
 * @param {QuestionType} type - The question type.
 * @returns {string} The label for the question type.
 */
export const getQuestionTypeLabel = (type: QuestionType): string => {
  switch (type) {
    case 'multiple-choice':
      return '単一選択';
    case 'multiple-select':
      return '複数選択';
    case 'free-text':
      return '自由入力';
    default:
      return '不明';
  }
};