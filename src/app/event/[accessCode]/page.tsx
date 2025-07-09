
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

import { Event, QuestionType, Question } from '@/types';

/**
 * Represents the payload for an answer submission.
 * @interface
 */
interface AnswerPayload {
  answer_text?: string;
  selected_options?: string[];
}

interface UserAnswer {
  question_id: number;
  answer_text?: string;
  selected_options?: string[];
}

/**
 * Props for the AnswerForm component.
 * @interface
 */
interface AnswerFormProps {
  question: Question;
  eventId: number;
  onAnswerSubmit: (questionId: number, answerPayload: AnswerPayload) => void;
  hasAnswered: boolean;
  userAnswer?: UserAnswer; // ユーザーの過去の回答を追加
}

import { supabase } from '@/lib/supabaseClient';
import { useSocket } from '@/hooks/useSocket';
import { getSessionId } from '@/lib/utils';


/**
 * A form component for users to submit answers to a question.
 * Handles different question types (free-text, multiple-choice, multiple-select).
 * @param {AnswerFormProps} props - The component props.
 * @param {Question} props.question - The question object to display.
 * @param {number} props.eventId - The ID of the event the question belongs to.
 * @param {(questionId: number, answerPayload: AnswerPayload) => void} props.onAnswerSubmit - Callback function to submit the answer.
 * @param {boolean} props.hasAnswered - Indicates if the user has already answered this question.
 * @returns {JSX.Element} The rendered answer form component.
 */
const AnswerForm = ({ question, eventId, onAnswerSubmit, hasAnswered, userAnswer }: AnswerFormProps) => {
    const [textAnswer, setTextAnswer] = useState<string>(userAnswer?.answer_text || '');
    const [selectedOption, setSelectedOption] = useState<string | null>(userAnswer?.selected_options?.[0] || null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>(userAnswer?.selected_options || []);

    useEffect(() => {
        // Reset form state when question changes or is re-opened
        // If there's a userAnswer for the new question, pre-fill the form
        setTextAnswer(userAnswer?.answer_text || '');
        setSelectedOption(userAnswer?.selected_options?.[0] || null);
        setSelectedOptions(userAnswer?.selected_options || []);
    }, [question, userAnswer]); // userAnswer も依存配列に追加

    const handleMultipleSelect = (option: string) => {
        const newSelection = selectedOptions.includes(option)
            ? selectedOptions.filter(item => item !== option)
            : [...selectedOptions, option];
        setSelectedOptions(newSelection);
    };

    const handleSubmit = async () => { // async を追加
        let answerPayload: AnswerPayload;
        switch (question.question_type) {
            case 'free-text':
                if (!textAnswer.trim()) {
                    toast('回答を入力してください。');
                    return;
                }
                answerPayload = { answer_text: textAnswer };
                break;
            case 'multiple-choice':
                if (!selectedOption) {
                    toast('選択肢を選んでください。');
                    return;
                }
                answerPayload = { selected_options: [selectedOption] };
                break;
            case 'multiple-select':
                if (selectedOptions.length === 0) {
                    toast('選択肢を1つ以上選んでください。');
                    return;
                }
                answerPayload = { selected_options: selectedOptions };
                break;
            default: return;
        }

        // 回答の更新ロジック
        if (userAnswer) { // 既存の回答がある場合
            const { error } = await supabase.from('answers')
                .update({ ...answerPayload, updated_at: new Date().toISOString() }) // updated_at を更新
                .eq('question_id', question.id)
                .eq('session_id', getSessionId()); // 現在のセッションIDで特定

            if (error) {
                toast('回答の更新に失敗しました。', {
                    description: error.message,
                });
                console.error('Answer update error:', error);
            } else {
                toast('回答を更新しました！');
                onAnswerSubmit(question.id, answerPayload); // 親コンポーネントに通知
            }
        } else { // 新規回答の場合
            onAnswerSubmit(question.id, answerPayload);
        }
    };

    if (hasAnswered && !question.allow_multiple_answers) {
        return (
            <Card className="mb-4 opacity-60">
                <CardHeader>
                    <CardTitle className="line-through">{question.text}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">この質問にはすでに回答済みです。</p>
                    {userAnswer && question.question_type === 'free-text' && (
                        <p className="mt-2 text-sm font-semibold">あなたの回答: <span className="font-normal">{userAnswer.answer_text}</span></p>
                    )}
                    {userAnswer && (question.question_type === 'multiple-choice' || question.question_type === 'multiple-select') && userAnswer.selected_options && (
                        <p className="mt-2 text-sm font-semibold">あなたの選択: <span className="font-normal">{userAnswer.selected_options.join(', ')}</span></p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>{question.text}</CardTitle>
            </CardHeader>
            <CardContent>
                {question.question_type === 'free-text' && (
                    <div className="grid gap-2">
                        <Label htmlFor={`free-text-${question.id}`}>回答を入力</Label>
                        <Textarea
                            id={`free-text-${question.id}`}
                            placeholder="回答を入力してください。"
                            value={textAnswer}
                            onChange={(e) => setTextAnswer(e.target.value)}
                            className="min-h-[100px]" // スマートフォンでの入力に適した高さ
                        />
                    </div>
                )}
                {question.question_type === 'multiple-choice' && question.options && (
                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="grid gap-2">
                        {question.options.map((opt, i) => (
                            <div
                                key={i}
                                className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer transition-colors duration-200 ${
                                    selectedOption === opt ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => setSelectedOption(opt)} // div 全体をタップ可能にする
                            >
                                <RadioGroupItem value={opt} id={`option-${question.id}-${i}`} className="sr-only" /> {/* 視覚的に非表示にする */}
                                <Label htmlFor={`option-${question.id}-${i}`} className="flex-grow py-1 cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                )}
                {question.question_type === 'multiple-select' && question.options && (
                    <div className="grid gap-2">
                        {question.options.map((opt, i) => (
                            <div
                                key={i}
                                className={`flex items-center space-x-2 p-2 border rounded-md cursor-pointer transition-colors duration-200 ${
                                    selectedOptions.includes(opt) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => handleMultipleSelect(opt)} // div 全体をタップ可能にする
                            >
                                <Checkbox
                                    id={`checkbox-${question.id}-${i}`}
                                    checked={selectedOptions.includes(opt)}
                                    onCheckedChange={() => handleMultipleSelect(opt)}
                                    className="sr-only" // 視覚的に非表示にする
                                />
                                <Label htmlFor={`checkbox-${question.id}-${i}`} className="flex-grow py-1 cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </div>
                )}
                <Button onClick={handleSubmit} className="mt-4 w-full">
                    {userAnswer ? '回答を更新する' : '回答する'} {/* ボタンテキストを変更 */}
                </Button>
            </CardContent>
        </Card>
    );
};

/**
 * EventPage component for audience members to view and answer questions for a specific event.
 * It fetches event and question data, manages user sessions, and handles answer submissions.
 * @returns {JSX.Element} The rendered EventPage component.
 */
export default function EventPage() {
  const params = useParams();
  const accessCode = (params && 'accessCode' in params && typeof params.accessCode === 'string') ? params.accessCode : undefined;
  const [event, setEvent] = useState<Event | null>(null);
  const [openQuestions, setOpenQuestions] = useState<Question[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]); // ユーザーの回答履歴を追加
  const { socket, isConnected } = useSocket(event?.id ? String(event.id) : null);

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  const fetchEventAndQuestions = useCallback(async () => {
    const currentSessionId = getSessionId();
    if (!accessCode) return;

    setLoading(true);
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, name')
      .eq('access_code', accessCode)
      .single();

    if (eventError || !eventData) {
      console.error('[EventPage] Error fetching event or event not found:', eventError);
      setEvent(null);
      setLoading(false);
      return;
    }
    setEvent(eventData as Event);

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('event_id', eventData.id)
      .eq('is_open', true);

    setOpenQuestions(questionsData as Question[] || []);

    // Fetch questions this session has already answered
    const { data: answeredData } = await supabase
      .from('answers')
      .select('question_id, answer_text, selected_options') // 回答内容も取得
      .eq('session_id', currentSessionId);

    if (answeredData) {
      const answeredIds = new Set(answeredData.map(a => a.question_id));
      setAnsweredQuestions(answeredIds);
      setUserAnswers(answeredData as UserAnswer[]); // ユーザーの回答履歴を保存
    }

    setLoading(false);
  }, [accessCode]);

  useEffect(() => {
    if (accessCode) {
      fetchEventAndQuestions();
    }
  }, [accessCode, fetchEventAndQuestions]);

  useEffect(() => {
    if (!socket || !event || !isConnected) {
      return;
    }

    socket.on('open-question', async (question: Question) => {
      if (question.event_id === Number(event?.id)) { // event.idを数値に変換して比較
        setOpenQuestions(prev => {
          // Add new question or update existing one if it was re-opened
          const existingIndex = prev.findIndex(q => q.id === question.id);
          if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex] = question;
              return updated;
          } else {
              return [...prev, question];
          }
        });
        // Remove from answered list if it's re-opened
        setAnsweredQuestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(question.id);
            return newSet;
        });
      }
    });

    socket.on('close-question', (questionId) => {
      setOpenQuestions(prev => prev.filter(q => q.id !== questionId));
    });

    socket.on('delete-question', (questionId) => {
      setOpenQuestions(prev => prev.filter(q => q.id !== questionId));
      setAnsweredQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
      });
    });

    return () => {
      if (socket) {
        socket.off('open-question');
        socket.off('close-question');
        socket.off('delete-question');
      }
    };
  }, [socket, event]);

  const handleAnswerSubmit = useCallback(async (questionId: number, answerPayload: AnswerPayload) => {
    const currentSessionId = getSessionId();
    if (!currentSessionId) {
        return;
    }

    const question = openQuestions.find(q => q.id === questionId);
    if (!question) return;

    // Check if multiple answers are disallowed and the user has already answered
    if (!question.allow_multiple_answers && answeredQuestions.has(questionId)) {
        toast('この質問にはすでに回答済みです。');
        return;
    }

    const { data, error } = await supabase.from('answers').insert([
        { question_id: questionId, session_id: sessionId, ...answerPayload }
    ]);

    if (error) {
        toast('回答の送信に失敗しました。', {
            description: error.message,
        });
        console.error('Answer submission error:', error);
    } else {
        toast('回答しました！');
        // Only mark as answered if multiple answers are NOT allowed
        if (!question.allow_multiple_answers) {
            setAnsweredQuestions(prev => new Set(prev).add(questionId));
        }
        if (socket && event) {
            socket.emit('new-answer', { questionId, eventId: event.id });
        }
    }
  }, [socket, event?.id, openQuestions, answeredQuestions, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">無効な参加コードです。</h1>
        <p className="text-muted-foreground">イベントが見つからないか、アクセスコードが間違っています。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{event.name}</CardTitle>
        </CardHeader>
      </Card>

      {openQuestions.length > 0 ? (
        openQuestions.map(q => (
          <AnswerForm
            key={q.id}
            question={q}
            eventId={event.id}
            onAnswerSubmit={handleAnswerSubmit}
            hasAnswered={answeredQuestions.has(q.id)}
            userAnswer={userAnswers.find(ans => ans.question_id === q.id)} // ユーザーの回答を渡す
          />
        ))
      ) : (
        <Card className="text-center">
          <CardContent className="py-8">
            <p className="text-muted-foreground">現在、回答できる質問はありません。</p>
          </CardContent>
        </Card>
      )}
      <Toaster />
    </div>
  );
}
