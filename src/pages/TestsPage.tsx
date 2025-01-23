import React, { useState } from 'react';
import { Trophy, Star, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import Confetti from 'react-confetti';
import { useQuizCompletions } from '../hooks/useQuizCompletions';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  answers: Answer[];
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  icon: 'trophy' | 'star' | 'award';
  maxPoints: number;
  completed?: boolean;
  questions: Question[];
}

const quizzes: Quiz[] = [
  {
    id: 'ai-recognition',
    title: 'Кто тут лайфхакер',
    icon: 'trophy',
    maxPoints: 100,
    questions: [
      {
        id: 'q1',
        text: 'Какое изобретение появилось раньше?',
        imageUrl: '',
        answers: [
          { id: 'a1', text: 'Электрический генератор', isCorrect: true },
          { id: 'a2', text: 'Дирижабль', isCorrect: false },
          { id: 'a3', text: 'Метрополитен', isCorrect: false  },
          { id: 'a4', text: 'Азбука Морзе', isCorrect: false }
        ],
        explanation: 'В 1831 году Майкл Фарадей открыл принцип работы электромагнитных генераторов. '
      },
      {
        id: 'q2',
        text: '«Отцом» чего называют русского инженера и изобретателя Владимира Зворыкина?',
        imageUrl: 'https://www.prlib.ru/sites/default/files/u535/zvorykin_vladimir_kuzmich.jpg',
        answers: [
          { id: 'a1', text: 'Радио', isCorrect: false },
          { id: 'a2', text: 'Телевидения', isCorrect: true },
          { id: 'a3', text: 'Телефона', isCorrect: false  },
          { id: 'a4', text: 'Телеграфа', isCorrect: false }
        ],
        explanation: 'Зворыкин принимал активное участие в развитии телевидения, в частности, был одним из изобретателей цветного телевидения.'
      },
      {
        id: 'q3',
        text: 'Сын отца инженера пригласил отца сына инженера на матч по хоккею. Кем по степени родства первый приходится второму, если инженера на хоккей не приглашали?',
        imageUrl: '',
        answers: [
          { id: 'a1', text: 'Сват', isCorrect: false },
          { id: 'a2', text: 'Зять', isCorrect: false },
          { id: 'a3', text: 'Шурин', isCorrect: true  },
          { id: 'a4', text: 'Деверь', isCorrect: false }
        ],
        explanation: 'Инженер - женщина. Значит, сын её отца - это брат, а отец её сына - муж. Для её мужа её брат является шурином.'
      },
      {
        id: 'q4',
        text: 'Людей, достигших какого возраста, называют супердолгожителями?',
        imageUrl: '',
        answers: [
          { id: 'a1', text: '95', isCorrect: true },
          { id: 'a2', text: '100', isCorrect: false },
          { id: 'a3', text: '105', isCorrect: false  },
          { id: 'a4', text: '110', isCorrect: false }
        ],
        explanation: '110'
      },
      {
        id: 'q5',
        text: 'Какое из этих двух вражений синонимично слову «кринж»?',
        imageUrl: '',
        answers: [
          { id: 'a1', text: 'Китайкая грамота', isCorrect: false },
          { id: 'a2', text: 'Испанский стыд', isCorrect: true }
        ],
        explanation: 'Испанский стыд'
      }  
      
    ]
  },
  {
    id: 'ai-basics',
    title: 'Основы искусственного интеллекта',
    icon: 'star',
    maxPoints: 120,
    questions: [
      {
        id: 'q1',
        text: 'Что такое машинное обучение?',
        answers: [
          { id: 'a1', text: 'Разработка алгоритмов, которые могут учиться на данных', isCorrect: true },
          { id: 'a2', text: 'Процесс ручного кодирования логики программ', isCorrect: false },
          { id: 'a3', text: 'Ручное тестирование программного обеспечения', isCorrect: false },
          { id: 'a4', text: 'Создание веб-приложений', isCorrect: false }
        ],
        explanation: 'Машинное обучение позволяет компьютерам учиться на опыте, не будучи явно запрограммированными.'
      }
    ]
  }
];

export function TestsPage() {
  const { profile } = useProfile(window.Telegram?.WebApp?.initDataUnsafe?.user || null);
  const { completedQuizzes, recordQuizCompletion } = useQuizCompletions(profile?.id || null);
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [quizProgress, setQuizProgress] = useState({
    currentQuestionIndex: 0,
    score: 0,
    selectedAnswers: {} as Record<string, string>,
    completed: false
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });


  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAnswer = async (answerId: string) => {
    if (selectedQuizIndex === null || selectedQuizIndex >= quizzes.length || !profile) return;

    // Check if quiz is already completed
    if (completedQuizzes.includes(quizzes[selectedQuizIndex].id)) {
      showNotification({
        title: 'Тест уже пройден',
        message: 'Вы не можете перепройти тест',
        type: 'warning'
      });
      return;
    }

    const quiz = quizzes[selectedQuizIndex];
    const currentQuestion = quiz.questions[quizProgress.currentQuestionIndex];
    const selectedAnswer = currentQuestion.answers.find(a => a.id === answerId);
    
    // Check if answer already selected
    if (quizProgress.selectedAnswers[currentQuestion.id]) return;
    
    if (!selectedAnswer) return;

    const newProgress = { ...quizProgress };
    const oldAnswer = newProgress.selectedAnswers[currentQuestion.id];
    newProgress.selectedAnswers[currentQuestion.id] = answerId;
    
    // Add haptic feedback
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (selectedAnswer.isCorrect) {
        tg.HapticFeedback.notificationOccurred('success');
      } else {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }

    if (selectedAnswer.isCorrect) {
      newProgress.score += 1;
    }

    if (quizProgress.currentQuestionIndex < quiz.questions.length - 1) {
      newProgress.currentQuestionIndex += 1;
    } else {
      newProgress.completed = true;
      const pointsEarned = 40; // Always award 40 points for completion

      try {
        // Record quiz completion
        const success = await recordQuizCompletion(
          quiz.id,
          quiz.title,
          newProgress.score,
          quiz.questions.length,
          40
        );

        if (!success) return;

        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        showNotification({
          title: 'Тест завершен!',
          message: 'Вы заработали 40 баллов!',
          type: 'success'
        });
      } catch (error) {
        console.error('Error updating points:', error);
        showNotification({
          title: 'Ошибка',
          message: 'Не удалось сохранить результаты',
          type: 'error'
        });
        return;
      }
    }

    setQuizProgress(newProgress);
  };

  const handleRestartQuiz = () => {
    // Check if quiz is already completed
    if (selectedQuizIndex !== null && completedQuizzes.includes(quizzes[selectedQuizIndex].id)) {
      showNotification({
        title: 'Тест уже пройден',
        message: 'Вы не можете перепройти тест',
        type: 'warning'
      });
      return;
    }

    setQuizProgress({
      currentQuestionIndex: 0,
      score: 0,
      selectedAnswers: {},
      completed: false
    });
  };

  const handleBackToList = () => {
    setSelectedQuizIndex(null);
    setQuizProgress({
      currentQuestionIndex: 0,
      score: 0,
      selectedAnswers: {},
      completed: false
    });
  };

  if (!profile) {
    return (
      <div className="card p-6">
        <p className="text-slate-400">
          Необходимо авторизоваться для прохождения тестов
        </p>
      </div>
    );
  }

  if (selectedQuizIndex === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Квизы" icon={Trophy}>
          <p className="text-emerald-primary/80 text-sm mt-1">
            Проверьте знания и заработайте баллы
          </p>
        </PageHeader>

        <div className="grid gap-4">
          {quizzes.map((quiz, index) => {
            const isCompleted = completedQuizzes.includes(quiz.id);
            return (
              <motion.button
                key={quiz.id}
                onClick={() => setSelectedQuizIndex(index)}
                disabled={isCompleted}
                className={`card p-4 text-left transition-all bg-gradient-to-br from-slate-800/50 to-slate-900/50 ${
                  isCompleted 
                    ? 'opacity-50 cursor-not-allowed bg-slate-800/30'
                    : 'hover:bg-slate-800/70'
                }`}
                whileHover={!isCompleted ? { scale: 1.02 } : undefined}
                whileTap={!isCompleted ? { scale: 0.98 } : undefined}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                      {quiz.icon === 'trophy' ? (
                        <Trophy className="w-6 h-6 text-emerald-primary/70" />
                      ) : quiz.icon === 'star' ? (
                        <Star className="w-6 h-6 text-emerald-primary/70" />
                      ) : (
                        <Award className="w-6 h-6 text-emerald-primary/70" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-light">{quiz.title}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        {quiz.questions.length} вопросов
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-full">
                          +{quiz.maxPoints} баллов
                        </span>
                        {isCompleted && ' • Пройден'}
                      </p>
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="bg-emerald-500/20 text-emerald-300 p-1.5 rounded-full">
                      <Trophy className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentQuiz = quizzes[selectedQuizIndex];
  const currentQuestion = currentQuiz.questions[quizProgress.currentQuestionIndex];

  return (
    <div className="space-y-6">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <PageHeader title={currentQuiz.title} icon={Trophy}>
        <div className="flex items-center justify-between">
          <p className="text-emerald-primary/80 text-sm mt-1">
            Вопрос {quizProgress.currentQuestionIndex + 1} из {currentQuiz.questions.length}
          </p>
          <button
            onClick={handleBackToList}
            className="text-sm text-slate-400 hover:text-slate-300"
          >
            Выбрать другой тест
          </button>
        </div>
      </PageHeader>

      {!quizProgress.completed ? (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-emerald-light mb-4">
              {currentQuestion.text}
            </h3>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Question"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => {
                const isSelected = quizProgress.selectedAnswers[currentQuestion.id] === answer.id;
                return (
                  <motion.button
                    key={answer.id}
                    onClick={() => handleAnswer(answer.id)}
                    disabled={quizProgress.selectedAnswers[currentQuestion.id] !== undefined}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      isSelected 
                        ? answer.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : quizProgress.selectedAnswers[currentQuestion.id] !== undefined
                          ? 'bg-slate-800/30 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 cursor-pointer'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span>{answer.text}</span>
                      {isSelected && (
                        <span className={answer.isCorrect ? 'text-emerald-300' : 'text-red-300'}>
                          {answer.isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
              {currentQuestion.explanation && quizProgress.selectedAnswers[currentQuestion.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/30"
                >
                  <p className="text-slate-300">{currentQuestion.explanation}</p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-primary"
              initial={{ width: '0%' }}
              animate={{
                width: `${((quizProgress.currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`
              }}
            />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-emerald-primary/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-emerald-primary" />
          </div>
          <h3 className="text-xl font-bold text-emerald-light mb-2">
            Тест завершен!
          </h3>
          <p className="text-slate-400 mb-4">
            Правильных ответов: {quizProgress.score} из {currentQuiz.questions.length}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleRestartQuiz}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Пройти заново
            </button>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 rounded-lg bg-emerald-primary text-white hover:bg-emerald-primary/90"
            >
              К списку тестов
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default TestsPage;