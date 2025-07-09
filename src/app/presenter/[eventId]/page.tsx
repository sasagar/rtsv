'use client';

import { useParams } from 'next/navigation';
import { usePresenterData } from '@/hooks/usePresenterData';
import AnimatedNumber from '@/components/AnimatedNumber';

import { Question, FreeTextAnswerResult, ChoiceAnswerResult, QuestionResult, DisplayDataItem } from '@/types';

/**
 * Props for the QuestionResultDisplay component.
 * @interface
 */
interface QuestionResultDisplayProps {
  question: Question;
  results: QuestionResult[];
}

import { getQuestionTypeLabel } from '@/lib/questionUtils';


/**
 * Determines whether to use white or black text for contrast based on a given background color.
 * @param {string} hexcolor - The background color in hexadecimal format (e.g., #RRGGBB).
 * @returns {string} '#FFFFFF' for dark backgrounds, '#000000' for light backgrounds.
 */
const getContrastTextColor = (hexcolor: string): string => {
  if (!hexcolor || hexcolor.length < 7) return '#000000'; // Default to black if invalid

  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF'; // Use black for light, white for dark
};

/**
 * Displays the results of a question for the presenter view.
 * It shows a bar chart for multiple-choice/select questions and a list of free-text answers.
 * Free-text answers that are marked as hidden will not be displayed.
 * @param {QuestionResultDisplayProps} props - The component props.
 * @param {Question} props.question - The question object to display results for.
 * @param {QuestionResult[]} props.results - The results data for the question.
 * @returns {JSX.Element | null} The rendered question result display component or null if question or results are not provided.
 */
const QuestionResultDisplay = ({ question, results }: QuestionResultDisplayProps) => {
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

    const maxCount = Math.max(...data.map(item => item.count), 0);

    return (
        <div className="p-6 shadow-md rounded-lg h-full flex flex-col w-full">
            <div className="p-0">
                <h2 className="text-2xl font-bold mb-2">{question.text}</h2>
                <p className="text-sm text-gray-500">タイプ: {getQuestionTypeLabel(question.question_type)}</p>
            </div>
            {
                question.question_type !== 'free-text' ? (
                    <div className="flex-grow flex flex-col justify-center p-0">
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <div key={index} className="mb-4 flex items-center w-full">
                                    <p className="min-w-[120px] mr-3 text-xl">{item.name}</p>
                                    <div className="flex-grow h-[60px] bg-gray-200 rounded-md overflow-hidden">
                                        <div className="h-full bg-[#8884d8] rounded-md flex items-center justify-end pr-2 box-border transition-all duration-500 ease-in-out"
                                            style={{ width: `${(item.count / maxCount) * 100}%` }}>
                                            <p className="text-white font-bold text-xl"><AnimatedNumber value={item.count} /></p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="mt-2 w-full p-0">
                                {data.map((item, index) => (
                                    <p key={index} className="text-base">・{item.name}</p>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {data.length > 0 ? (
                            data.map((item, index) => {
                                const cardBgColor = item.is_picked ? '#FFD700' : '#FFFFFF'; // Gold for picked, white for others
                                const cardTextColor = getContrastTextColor(cardBgColor);
                                return (
                                    <div key={index} className="col-span-1">
                                        <div
                                            className={`p-4 h-full flex flex-col justify-between rounded-md transition-all duration-300 ease-in-out ${item.is_picked ? 'shadow-lg border-2 border-orange-400' : 'shadow-sm border border-gray-200'}`}
                                            style={{ backgroundColor: cardBgColor, color: cardTextColor }}
                                        >
                                            <p className="break-words text-base">{item.name}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full">
                                <p className="text-sm text-gray-500">まだ回答がありません。</p>
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
};

/**
 * PresenterPage component for displaying real-time question results to an audience.
 * It fetches event and question data, and updates results via Socket.IO.
 * @returns {JSX.Element} The rendered PresenterPage component.
 */
export default function PresenterPage() {
  const params = useParams();
  const eventId = (params && 'eventId' in params && typeof params.eventId === 'string') ? params.eventId : undefined;

  const {
    event,
    displayedQuestions,
    currentDisplayedQuestionId,
    questionResults,
    loading,
  } = usePresenterData(eventId);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  if (!event) {
    return <div className="container mx-auto"><p className="text-red-500 mt-4 text-xl">イベントが見つかりません。</p></div>;
  }

  const currentQuestion = displayedQuestions.find(q => q.id === currentDisplayedQuestionId);

  return (
    <div className="h-screen flex flex-col w-full" style={{ backgroundColor: event.background_color || '#FFFFFF', color: event.text_color || '#000000' }}>
      <div className="my-0 p-4 text-center shadow-md rounded-none">
        <h1 className="text-4xl font-bold mb-1">
          {currentQuestion ? currentQuestion.text : '質問を選択してください'}
        </h1>
        <p className="text-lg text-gray-500">{event.name}</p>
      </div>

      <div className="flex-grow flex items-center p-6">
        {currentQuestion ? (
          <QuestionResultDisplay question={currentQuestion} results={questionResults[currentQuestion.id]} />
        ) : (
          <div className="w-full">
            <p className="text-center mt-4">管理画面から表示する質問を選択してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
