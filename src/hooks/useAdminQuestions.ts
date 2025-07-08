import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSocket } from '@/hooks/useSocket';
import { Event, Question, QuestionResult, FreeTextAnswerResult, ChoiceAnswerResult, QuestionType } from '@/types';

/**
 * Custom hook for managing admin-related question and answer logic.
 * Handles fetching, adding, deleting, toggling questions, and managing free-text answer states.
 * @param {string | undefined} eventId - The ID of the event being managed.
 * @returns {{
 *   event: Event | undefined;
 *   questions: Question[];
 *   questionResults: { [key: number]: QuestionResult[] };
 *   newQuestionText: string;
 *   setNewQuestionText: React.Dispatch<React.SetStateAction<string>>;
 *   newQuestionType: QuestionType;
 *   setNewQuestionType: React.Dispatch<React.SetStateAction<QuestionType>>;
 *   newQuestionOptions: string[];
 *   setNewQuestionOptions: React.Dispatch<React.SetStateAction<string[]>>;
 *   newQuestionAllowMultipleAnswers: boolean;
 *   setNewQuestionAllowMultipleAnswers: React.Dispatch<React.SetStateAction<boolean>>;
 *   expandedQuestionId: number | null;
 *   handleToggleExpand: (questionId: number | null) => void;
 *   handleAddQuestion: () => Promise<void>;
 *   handleDeleteQuestion: (questionId: number) => Promise<void>;
 *   handleToggleQuestion: (questionId: number, isOpen: boolean) => Promise<void>;
 *   handlePickAnswerToggle: (questionId: number, answerId: number, isPicked: boolean) => Promise<void>;
 *   handleHideAnswerToggle: (questionId: number, answerId: number, isHidden: boolean) => Promise<void>;
 *   handleDisplayQuestion: (questionId: number) => void;
 *   handleHideDisplayQuestion: (eventId: string) => void;
 * }}
 */
export const useAdminQuestions = (eventId: string | undefined): {
  event: Event | undefined;
  questions: Question[];
  questionResults: { [key: number]: QuestionResult[] };
  newQuestionText: string;
  setNewQuestionText: React.Dispatch<React.SetStateAction<string>>;
  newQuestionType: QuestionType;
  setNewQuestionType: React.Dispatch<React.SetStateAction<QuestionType>>;
  newQuestionOptions: string[];
  setNewQuestionOptions: React.Dispatch<React.SetStateAction<string[]>>;
  newQuestionAllowMultipleAnswers: boolean;
  setNewQuestionAllowMultipleAnswers: React.Dispatch<React.SetStateAction<boolean>>;
  expandedQuestionId: number | null;
  handleToggleExpand: (questionId: number | null) => void;
  handleAddQuestion: () => Promise<void>;
  handleDeleteQuestion: (questionId: number) => Promise<void>;
  handleToggleQuestion: (questionId: number, isOpen: boolean) => Promise<void>;
  handlePickAnswerToggle: (questionId: number, answerId: number, isPicked: boolean) => Promise<void>;
  handleHideAnswerToggle: (questionId: number, answerId: number, isHidden: boolean) => Promise<void>;
  handleDisplayQuestion: (questionId: number) => void;
  handleHideDisplayQuestion: (eventId: string) => void;
} => {
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionResults, setQuestionResults] = useState<{ [key: number]: QuestionResult[] }>({});
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('multiple-choice');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '']);
  const [newQuestionAllowMultipleAnswers, setNewQuestionAllowMultipleAnswers] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const { socket, isConnected } = useSocket(eventId || null);

  const fetchQuestionResults = useCallback(async (qId: number): Promise<QuestionResult[]> => {
    const { data, error } = await supabase.rpc('get_question_results', { q_id: qId });
    if (error) {
      console.error('Error fetching results for question', qId, ':', error);
      return [];
    }
    return (data || []) as QuestionResult[];
  }, []);

  useEffect(() => {
    const fetchEventAndQuestions = async () => {
      if (!eventId) return;

      const { data: eventData, error: eventError } = await supabase.from('events').select().eq('id', eventId).single();
      if (eventError || !eventData) {
        console.error('Error fetching event:', eventError);
        return;
      }
      setEvent(eventData as Event);

      const { data: questionsData } = await supabase.from('questions').select().eq('event_id', eventId).order('created_at');
      setQuestions(questionsData as Question[] || []);

      const results: { [key: number]: QuestionResult[] } = {};
      for (const q of (questionsData || [])) {
        results[q.id] = (await fetchQuestionResults(q.id)) || [];
      }
      setQuestionResults(results);
    };

    fetchEventAndQuestions();
  }, [eventId, fetchQuestionResults]);

  useEffect(() => {
    if (!socket || !event || !isConnected) {
      return;
    }

    socket.on('update-results', async ({ questionId }) => {
      const results = (await fetchQuestionResults(questionId)) || [];
      setQuestionResults(prev => ({ ...prev, [questionId]: results }));
    });

    return () => {
      if (socket) {
        socket.off('update-results');
      }
    };
  }, [socket, event, fetchQuestionResults, isConnected]);

  const handleToggleExpand = (questionId: number | null) => {
    setExpandedQuestionId(prev => prev === questionId ? null : questionId);
  };

  const handleAddQuestion = async () => {
    if (!newQuestionText.trim()) {
      alert('質問内容を入力してください。');
      return;
    }

    const questionPayload: Partial<Question> = {
      event_id: Number(eventId),
      text: newQuestionText,
      question_type: newQuestionType,
      options: newQuestionType !== 'free-text' ? newQuestionOptions.filter(opt => opt.trim() !== '') : null,
      allow_multiple_answers: newQuestionAllowMultipleAnswers,
    };

    const { data, error } = await supabase
      .from('questions')
      .insert([questionPayload])
      .select();

    if (error) {
      console.error("Error adding question:", error);
      alert('質問の追加に失敗しました。');
      return;
    }

    if (data) {
      const newQuestion = data[0];
      setQuestions([...questions, newQuestion]);
      setNewQuestionText('');
      setNewQuestionType('multiple-choice');
      setNewQuestionOptions(['', '']);

      const newQuestionResults = (await fetchQuestionResults(newQuestion.id)) || [];
      setQuestionResults(prev => ({ ...prev, [newQuestion.id]: newQuestionResults }));
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) {
        alert('質問の削除に失敗しました。');
    } else {
        setQuestions(questions.filter(q => q.id !== questionId));
        setQuestionResults(prev => {
            const newResults = { ...prev };
            delete newResults[questionId];
            return newResults;
        });
        if(socket) {
            socket.emit('delete-question', { questionId, eventId });
        }
    }
  };

  const handleToggleQuestion = async (questionId: number, isOpen: boolean) => {
    const { data, error } = await supabase
      .from('questions')
      .update({ is_open: isOpen })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
        alert('質問の状態更新に失敗しました。');
        return;
    }

    if (data) {
      setQuestions(questions.map(q => q.id === questionId ? data : q));
      if (socket) {
        if (isOpen) {
            socket.emit('open-question', data);
        } else {
            socket.emit('close-question', { questionId, eventId });
        }
      }
    }
  };

  const handleDisplayQuestion = (questionId: number) => {
    if (socket) {
      socket.emit('display-question', { questionId, eventId });
    }
  };

  const handleHideDisplayQuestion = (eventId: string) => {
    if (socket && isConnected) {
      socket.emit('hide-results', { eventId });
    }
  };

  const handlePickAnswerToggle = async (questionId: number, answerId: number, isPicked: boolean) => {
    const { error } = await supabase
      .from('answers')
      .update({ is_picked: isPicked })
      .eq('id', answerId);

    if (error) {
      console.error('Error updating answer pick status:', error);
      alert('回答のピックアップ状態の更新に失敗しました。');
      return;
    }

    setQuestionResults(prevResults => {
      const newResults = { ...prevResults };
      if (newResults[questionId]) {
        newResults[questionId] = newResults[questionId].map(answer => {
          if ('id' in answer && answer.id === answerId) {
            return { ...answer, is_picked: isPicked };
          }
          return answer;
        });
      }
      return newResults;
    });

    if (socket && isConnected) {
      socket.emit('pick-answer', { eventId, questionId, answerId, isPicked });
    }
  };

  const handleHideAnswerToggle = async (questionId: number, answerId: number, isHidden: boolean) => {
    const { error } = await supabase
      .from('answers')
      .update({ is_hidden: isHidden })
      .eq('id', answerId);

    if (error) {
      console.error('Error updating answer hide status:', error);
      alert('回答の非表示状態の更新に失敗しました。');
      return;
    }

    setQuestionResults(prevResults => {
      const newResults = { ...prevResults };
      if (newResults[questionId]) {
        newResults[questionId] = newResults[questionId].map(answer => {
          return ('id' in answer && answer.id === answerId) ? { ...answer, is_hidden: isHidden } : answer;
        });
      }
      return newResults;
    });

    if (socket && isConnected) {
      socket.emit('hide-answer', { eventId, questionId, answerId, isHidden });
    }
  };

  return {
    event,
    questions,
    questionResults,
    newQuestionText,
    setNewQuestionText,
    newQuestionType,
    setNewQuestionType,
    newQuestionOptions,
    setNewQuestionOptions,
    newQuestionAllowMultipleAnswers,
    setNewQuestionAllowMultipleAnswers,
    expandedQuestionId,
    handleToggleExpand,
    handleAddQuestion,
    handleDeleteQuestion,
    handleToggleQuestion,
    handlePickAnswerToggle,
    handleHideAnswerToggle,
    handleDisplayQuestion,
    handleHideDisplayQuestion,
  };
};
