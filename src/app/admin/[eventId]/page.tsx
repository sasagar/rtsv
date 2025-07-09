'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { HexColorPicker, HexColorInput } from 'react-colorful';
import AdminAddQuestionForm from '@/components/admin/AdminAddQuestionForm';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Dialog コンポーネントを追加

import { Event, QuestionType, Question, FreeTextAnswerResult, ChoiceAnswerResult, QuestionResult, DisplayDataItem } from '@/types';
import { getQuestionTypeLabel } from '@/lib/questionUtils';


/**
 * Props for the QuestionResultDisplay component.
 * @interface
 */
interface QuestionResultDisplayProps {
    question: Question;
    results: QuestionResult[];
    onPickToggle: (questionId: number, answerId: number, isPicked: boolean) => void;
    onHideToggle: (questionId: number, answerId: number, isHidden: boolean) => void;
}

/**
 * Type guard to check if a DisplayDataItem is a FreeTextDisplayItem.
 * @param {DisplayDataItem} item - The item to check.
 * @returns {boolean} True if the item is a FreeTextDisplayItem, false otherwise.
 */
function isFreeTextDisplayItem(item: DisplayDataItem): item is (DisplayDataItem & { id: number, is_picked: boolean, is_hidden: boolean }) {
    return typeof item.id === 'number' && item.is_picked !== undefined && item.is_hidden !== undefined;
}

/**
 * Displays the results of a question, either as a bar chart for multiple-choice/select
 * or as a list of free-text answers with pick/hide toggles.
 * @param {QuestionResultDisplayProps} props - The component props.
 * @returns {JSX.Element | null} The rendered question result display component, or null if no question or results.
 */
const QuestionResultDisplay = ({ question, results, onPickToggle, onHideToggle }: QuestionResultDisplayProps) => {
    if (!question || !results) return null;

    const data: DisplayDataItem[] = results.filter(r => {
        // Free-text answers have is_hidden, other types don't
        if ('is_hidden' in r && r.is_hidden !== undefined) {
            return !r.is_hidden;
        }
        return true;
    }).map(r => {
        if (question.question_type === 'free-text') {
            const freeTextResult = r as FreeTextAnswerResult;
            return {
                id: freeTextResult.id,
                name: freeTextResult.text,
                count: 1, // Free text answers are counted as 1 for display purposes
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
                                            {isFreeTextDisplayItem(item) && item.is_picked ? <PinIcon className="h-4 w-4" /> : <PinOffIcon className="h-4 w-4" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            if (isFreeTextDisplayItem(item)) {
                                                onHideToggle(question.id, item.id, !item.is_hidden);
                                            }
                                        }}>
                                            {isFreeTextDisplayItem(item) && item.is_hidden ? <CheckCircleIcon className="h-4 w-4" /> : <BanIcon className="h-4 w-4" />}
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
/**
 * The administration page for a specific event.
 * Allows administrators to manage questions, view results, and customize display settings for the presenter screen.
 * @returns {JSX.Element} The rendered event administration page.
 */
export default function EventAdmin() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

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

  const [backgroundColor, setBackgroundColor] = useState<string>(event?.background_color || '#FFFFFF');
  const [textColor, setTextColor] = useState<string>(event?.text_color || '#000000');

  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false); // モーダルの開閉状態

  useEffect(() => {
    if (event?.background_color) {
      setBackgroundColor(event.background_color);
    }
    if (event?.text_color) {
      setTextColor(event.text_color);
    }
  }, [event?.background_color, event?.text_color]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  /**
   * Handles the update of event display settings (background and text colors).
   * Updates the event in the Supabase database.
   * @async
   * @returns {Promise<void>}
   */
  const handleUpdateEvent = async () => {
    if (!event) return;

    const { error } = await supabase
      .from('events')
      .update({ background_color: backgroundColor, text_color: textColor })
      .eq('id', event.id);

    if (error) {
      console.error('Error updating event display settings:', error);
      alert('表示設定の更新に失敗しました。');
    } else {
      alert('表示設定を更新しました。');
    }
  };

  /**
   * Callback function executed after a new question has been successfully added.
   * Closes the add question modal.
   * @param {Question} newQuestion - The newly added question object.
   */
  const handleAddQuestionCallback = (newQuestion: Question) => {
    // 質問追加後にモーダルを閉じる
    setIsAddQuestionModalOpen(false);
    // useAdminQuestions の handleAddQuestion が既に質問一覧を更新しているはずなので、ここでは不要かもしれません。
    // 必要であれば fetchEvents() を呼び出す
  };

  if (authLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

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
        <TabsList className="grid w-full grid-cols-3"> {/* add-question タブを削除したので grid-cols-3 に変更 */}
          <TabsTrigger value="event-info">イベント情報</TabsTrigger>
          <TabsTrigger value="question-management">質問管理</TabsTrigger>
          <TabsTrigger value="display-settings">表示設定</TabsTrigger>
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
        
        <TabsContent value="question-management">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"> {/* flex-row, items-center, justify-between を追加 */}
              <CardTitle className="text-xl font-semibold">質問一覧</CardTitle>
              <Dialog open={isAddQuestionModalOpen} onOpenChange={setIsAddQuestionModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    新しい質問を追加
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>新しい質問を追加</DialogTitle>
                  </DialogHeader>
                  <AdminAddQuestionForm eventId={eventId} onQuestionAdded={handleAddQuestionCallback} supabase={supabase} />
                </DialogContent>
              </Dialog>
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
                        {/* 質問の開始/停止ボタン */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleQuestion(q.id, !q.is_open)}
                        >
                          {q.is_open ? <SquareIcon className="mr-2 h-4 w-4" /> : <PlayIcon className="mr-2 h-4 w-4" />}
                          {q.is_open ? '質問を停止' : '質問を開始'}
                        </Button>
                        {/* 回答を締め切るボタン */}
                        {q.is_open && ( // 質問が公開中の場合のみ表示
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleQuestion(q.id, false)} // is_open を false に設定
                          >
                            <BanIcon className="mr-2 h-4 w-4" />
                            回答を締め切る
                          </Button>
                        )}
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
        <TabsContent value="display-settings">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">投影画面の表示設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">背景色</Label>
                  <div className="flex items-center gap-2">
                    <HexColorInput prefixed color={backgroundColor} onChange={setBackgroundColor} className="w-24" />
                    <div style={{ backgroundColor: backgroundColor, width: '32px', height: '32px', border: '1px solid #ccc' }} />
                    <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                  </div>
                  <Input
                    id="backgroundColor"
                    placeholder="例: #RRGGBB, rgb(R,G,B), oklch(L C H)"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="textColor">文字色</Label>
                  <div className="flex items-center gap-2">
                    <HexColorInput prefixed color={textColor} onChange={setTextColor} className="w-24" />
                    <div style={{ backgroundColor: textColor, width: '32px', height: '32px', border: '1px solid #ccc' }} />
                    <HexColorPicker color={textColor} onChange={setTextColor} />
                  </div>
                  <Input
                    id="textColor"
                    placeholder="例: #RRGGBB, rgb(R,G,B), oklch(L C H)"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button onClick={handleUpdateEvent} className="w-full">
                  設定を保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
