import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSocket } from '@/hooks/useSocket';
import { Event, Question, QuestionResult } from '@/types';

/**
 * Custom hook for managing presenter view data.
 * Handles fetching event data, questions, and real-time updates for question display and results.
 * @param {string | undefined} eventId - The ID of the event.
 * @returns {{
 *   event: Event | null;
 *   displayedQuestions: Question[];
 *   currentDisplayedQuestionId: number | null;
 *   questionResults: { [key: number]: QuestionResult[] };
 *   loading: boolean;
 * }}
 */
export const usePresenterData = (eventId: string | undefined) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [displayedQuestions, setDisplayedQuestions] = useState<Question[]>([]);
  const [currentDisplayedQuestionId, setCurrentDisplayedQuestionId] = useState<number | null>(null);
  const [questionResults, setQuestionResults] = useState<{ [key: number]: QuestionResult[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
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
    const fetchInitialData = async () => {
      if (!eventId) return;

      setLoading(true);
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        console.error('Error fetching event:', eventError);
        setEvent(null);
      } else {
        setEvent(eventData as Event);
      }
      setLoading(false);
    };

    fetchInitialData();
  }, [eventId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleDisplayQuestion = async ({ questionId }: { questionId: number }) => {
      const { data, error } = await supabase.from('questions').select('*').eq('id', questionId).single();
      if (error || !data) {
        console.error('Error fetching question to display:', error);
        return;
      }
      const question = data as Question;
      if (!displayedQuestions.some(q => q.id === question.id)) {
        setDisplayedQuestions(prev => [...prev, question]);
      }
      setCurrentDisplayedQuestionId(question.id);
      const results = await fetchQuestionResults(question.id);
      setQuestionResults(prev => ({ ...prev, [question.id]: results }));
    };

    const handleUpdateResults = async ({ questionId }: { questionId: number }) => {
      const results = await fetchQuestionResults(questionId);
      setQuestionResults(prev => ({ ...prev, [questionId]: results }));
    };

    const handleHideResults = () => {
      setCurrentDisplayedQuestionId(null);
    };

    socket.on('display-question', handleDisplayQuestion);
    socket.on('update-results', handleUpdateResults);
    socket.on('hide-results', handleHideResults);

    return () => {
      socket.off('display-question', handleDisplayQuestion);
      socket.off('update-results', handleUpdateResults);
      socket.off('hide-results', handleHideResults);
    };
  }, [socket, isConnected, fetchQuestionResults, displayedQuestions]);

  return { event, displayedQuestions, currentDisplayedQuestionId, questionResults, loading };
};