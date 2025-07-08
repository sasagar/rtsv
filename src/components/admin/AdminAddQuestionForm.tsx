import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, MinusIcon } from 'lucide-react';
import { QuestionType, Question } from '@/types';

/**
 * Props for the AdminAddQuestionForm component.
 * @interface
 */
interface AdminAddQuestionFormProps {
  eventId: string;
  onQuestionAdded: (newQuestion: Question) => void;
  supabase: any; // TODO: 型を修正する
}

/**
 * A form component for administrators to add new questions to an event.
 * @param {AdminAddQuestionFormProps} props - The component props.
 * @returns {JSX.Element} The rendered form component.
 */
const AdminAddQuestionForm: React.FC<AdminAddQuestionFormProps> = ({ eventId, onQuestionAdded, supabase }) => {
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('multiple-choice');
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(['', '']);
  const [newQuestionAllowMultipleAnswers, setNewQuestionAllowMultipleAnswers] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newQuestionOptions];
    updatedOptions[index] = value;
    setNewQuestionOptions(updatedOptions);
  };

  const handleAddOption = () => {
    setNewQuestionOptions([...newQuestionOptions, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (newQuestionOptions.length > 2) {
      const updatedOptions = newQuestionOptions.filter((_, i) => i !== index);
      setNewQuestionOptions(updatedOptions);
    }
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
      onQuestionAdded(newQuestion);
      setNewQuestionText('');
      setNewQuestionType('multiple-choice');
      setNewQuestionOptions(['', '']);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">新しい質問を追加</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="questionContent">質問内容</Label>
            <Input
              id="questionContent"
              placeholder="質問内容"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
            />
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <Label htmlFor="questionType">質問タイプ</Label>
            <Select
              value={newQuestionType}
              onValueChange={(value) => setNewQuestionType(value as QuestionType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="質問タイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple-choice">単一選択</SelectItem>
                <SelectItem value="multiple-select">複数選択</SelectItem>
                <SelectItem value="free-text">自由入力</SelectItem>
              </SelectContent>
            </Select>
          </div>
          (['multiple-choice', 'multiple-select']).includes(newQuestionType) &&
            <div className="grid gap-2">
              <Label>選択肢</Label>
              {newQuestionOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`選択肢 ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} disabled={newQuestionOptions.length <= 2}>
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddOption}>
                <PlusIcon className="mr-2 h-4 w-4" />
                選択肢を追加
              </Button>
            </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowMultipleAnswers"
              checked={newQuestionAllowMultipleAnswers}
              onCheckedChange={(checked) => setNewQuestionAllowMultipleAnswers(checked as boolean)}
            />
            <Label htmlFor="allowMultipleAnswers">複数回答を許可する</Label>
          </div>
          <Button
            onClick={handleAddQuestion}
            className="w-full"
          >
            質問を追加する
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminAddQuestionForm;
