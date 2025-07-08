
'use client';

import { useParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusIcon, MinusIcon, PlayIcon, SquareIcon, EyeIcon, EyeOffIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, PinIcon, PinOffIcon, BanIcon, CheckCircleIcon
} from 'lucide-react';
import { useAdminQuestions } from '@/hooks/useAdminQuestions';
import AdminAddQuestionForm from '@/components/admin/AdminAddQuestionForm';
import { supabase } from '@/lib/supabaseClient';

import { Event, QuestionType, Question, FreeTextAnswerResult, ChoiceAnswerResult, QuestionResult, DisplayDataItem } from '@/types';
import { getQuestionTypeLabel } from '@/lib/questionUtils';


interface QuestionResultDisplayProps {
    question: Question;
    results: QuestionResult[];
    onPickToggle: (questionId: number, answerId: number, isPicked: boolean) => void;
    onHideToggle: (questionId: number, answerId: number, isHidden: boolean) => void;
}

function isFreeTextDisplayItem(item: DisplayDataItem): item is (DisplayDataItem & { id: number, is_picked: boolean, is_hidden: boolean }) {
    return typeof item.id === 'number' && item.is_picked !== undefined && item.is_hidden !== undefined;
}

const QuestionResultDisplay = ({ question, results, onPickToggle, onHideToggle }: QuestionResultDisplayProps) => {
    if (!question || !results) return null;

    const data: DisplayDataItem[] = results.map(r => {
        if (question.question_type === 'free-text') {
            const freeTextResult = r as FreeTextAnswerResult;
            return {
                id: freeTextResult.id,
                name: freeTextResult.text,
                count: 1,
                is_picked: freeTextResult.is_picked,
                is_hidden: freeTextResult.is_hidden,
            };
        } else {
            const choiceResult = r as ChoiceAnswerResult;
            return {
                name: choiceResult.option,
                count: choiceResult.count,
            };
        }
    });

    return (
        <div className="mt-4">
            {question.question_type !== 'free-text' ? (
                data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={Math.max(data.length * 50, 200)}>
                        <BarChart data={data} layout="vertical" margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                            <Tooltip formatter={(value: number, name, props) => [`${value} (${((value / data.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%)`, '回答数']} />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="回答数" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-sm text-muted-foreground">まだ回答がありません。</p>
                )
            ) : (
                data.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.map((item, index) => (
                            <Card key={index} className={`relative ${isFreeTextDisplayItem(item) && item.is_picked ? 'border-2 border-primary shadow-lg' : ''}`}>
                                <CardContent className="p-4">
                                    <p className={`text-sm ${isFreeTextDisplayItem(item) && item.is_hidden ? 'line-through text-muted-foreground' : ''}`}>{item.name}</p>
                                    <div className="absolute top-2 right-2 flex space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            if (isFreeTextDisplayItem(item)) {
                                                onPickToggle(question.id, item.id, !item.is_picked);
                                            }
                                        }}>
                                            {isFreeTextDisplayItem(item) && item.is_picked ? <PinIcon className="h-4 w-4 text-primary" /> : <PinOffIcon className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            if (isFreeTextDisplayItem(item)) {
                                                onHideToggle(question.id, item.id, !item.is_hidden);
                                            }
                                        }}>
                                            {isFreeTextDisplayItem(item) && item.is_hidden ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <BanIcon className="h-4 w-4 text-red-500" />}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">まだ回答がありません。</p>
                )
            )}
        </div>
    );
};

/**
 * EventAdmin component for managing events and questions.
 * Allows administrators to add, open, close, display, hide, and delete questions.
 * It also provides functionality to pick and hide individual free-text answers.
 * @returns {JSX.Element} The rendered EventAdmin component.
 */
export default function EventAdmin() {
  const params = useParams();
  const eventId = params?.eventId as string;

  const {
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
  } = useAdminQuestions(eventId);

  const handleAddQuestionCallback = (newQuestion: Question) => {
    // You can optionally handle the newly added question here if needed
  };

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="event-info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="event-info">イベント情報</TabsTrigger>
          <TabsTrigger value="question-management">質問管理</TabsTrigger>
          <TabsTrigger value="add-question">新しい質問</TabsTrigger>
        </TabsList>
        <TabsContent value="event-info">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{event?.name}</CardTitle>
              <CardDescription>
                <p className="text-lg">参加コード: <strong className="text-blue-600">{event?.access_code}</strong></p>
                <p>投影用URL: <a href={`/presenter/${eventId}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{`/presenter/${eventId}`}</a></p>
                <p>参加用URL: <a href={`/event/${event.access_code}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{`/event/${event.access_code}`}</a></p>
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="add-question">
          <AdminAddQuestionForm eventId={eventId} onQuestionAdded={handleAddQuestionCallback} supabase={supabase} />
        </TabsContent>
        <TabsContent value="question-management">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">質問一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map(q => (
                  <div key={q.id} className="rounded-md border p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                      <div>
                        <p className="text-lg font-medium">{q.text}</p>
                        <p className="text-sm text-muted-foreground">タイプ: {getQuestionTypeLabel(q.question_type)}</p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 mt-2 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleQuestion(q.id, !q.is_open)}
                        >
                          {q.is_open ? <SquareIcon className="mr-2 h-4 w-4" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                          {q.is_open ? '質問を停止' : '質問を開始'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisplayQuestion(q.id)}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          投影画面に表示
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleHideDisplayQuestion(eventId)}
                        >
                          <EyeOffIcon className="mr-2 h-4 w-4" />
                          結果を非表示
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteQuestion(q.id)}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          削除
                        </Button>
                      </div>
                    </div>
                    <Collapsible
                      open={expandedQuestionId === q.id}
                      onOpenChange={() => handleToggleExpand(q.id)}
                      className="w-full space-y-2"
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          {expandedQuestionId === q.id ? <ChevronUpIcon className="mr-2 h-4 w-4" /> : <ChevronDownIcon className="mr-2 h-4 w-4" />}
                          {expandedQuestionId === q.id ? '結果を隠す' : '結果を表示'}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2">
                        {q.question_type !== 'free-text' && q.options && q.options.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold">選択肢:</p>
                            <ul className="list-inside list-disc text-sm">
                              {q.options.map((option, idx) => (
                                <li key={idx}>{option}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="mt-2">
                          <p className="text-sm font-semibold">現在の結果:</p>
                          <QuestionResultDisplay question={q} results={questionResults[q.id] as FreeTextAnswerResult[] | ChoiceAnswerResult[] || []} onPickToggle={handlePickAnswerToggle} onHideToggle={handleHideAnswerToggle} />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
