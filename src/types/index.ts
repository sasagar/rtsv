/**
 * Represents an event.
 * @interface
 */
export interface Event {
  id: number;
  name: string;
  access_code: string;
}

/**
 * Defines the possible types of questions.
 * @typedef {'multiple-choice' | 'multiple-select' | 'free-text'} QuestionType
 */
export type QuestionType = 'multiple-choice' | 'multiple-select' | 'free-text';

/**
 * Represents a question.
 * @interface
 */
export interface Question {
  id: number;
  event_id: number;
  text: string;
  question_type: QuestionType;
  options: string[] | null;
  is_open: boolean;
  allow_multiple_answers: boolean;
  created_at: string;
}

/**
 * Represents the result of a free-text answer.
 * @interface
 */
export interface FreeTextAnswerResult {
  id: number;
  text: string;
  is_picked: boolean;
  is_hidden: boolean;
}

/**
 * Represents the result of a multiple-choice or multiple-select answer.
 * @interface
 */
export interface ChoiceAnswerResult {
  option: string;
  count: number;
}

/**
 * Represents a union type for question results.
 * @typedef {FreeTextAnswerResult | ChoiceAnswerResult} QuestionResult
 */
export type QuestionResult = FreeTextAnswerResult | ChoiceAnswerResult;

/**
 * Represents a data item for display purposes in charts or lists.
 * It combines properties from FreeTextAnswerResult and ChoiceAnswerResult.
 * @interface
 */
export interface DisplayDataItem {
    name: string;
    count: number;
    id?: number;
    is_picked?: boolean;
    is_hidden?: boolean;
    option?: string;
    text?: string;
}
