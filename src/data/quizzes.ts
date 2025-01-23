import { Trophy, Star, Award } from 'lucide-react';

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
  questions: Question[];
}

export const quizzes: Quiz[] = [
  {
    id: 'day1-quiz',
    title: 'Итоги первого дня',
    icon: 'trophy',
    maxPoints: 40,
    questions: [
      {
        id: 'q1',
        text: 'Какие основные цели были поставлены на установочном собрании?',
        answers: [
          { id: 'a1', text: 'Повышение эффективности и обмен опытом', isCorrect: true },
          { id: 'a2', text: 'Только развлекательная программа', isCorrect: false },
          { id: 'a3', text: 'Планирование отпусков', isCorrect: false },
          { id: 'a4', text: 'Обсуждение зарплат', isCorrect: false }
        ],
        explanation: 'На установочном собрании были поставлены цели по повышению эффективности работы и обмену опытом между участниками.'
      },
      {
        id: 'q2',
        text: 'Сколько времени отведено на общее знакомство участников?',
        answers: [
          { id: 'a1', text: '30 минут', isCorrect: false },
          { id: 'a2', text: '1 час', isCorrect: true },
          { id: 'a3', text: '2 часа', isCorrect: false },
          { id: 'a4', text: '45 минут', isCorrect: false }
        ],
        explanation: 'По программе на общее знакомство участников выделен 1 час (с 17:45 до 18:45).'
      }
    ]
  },
  {
    id: 'day2-quiz',
    title: 'Итоги второго дня',
    icon: 'star',
    maxPoints: 40,
    questions: [
      {
        id: 'q1',
        text: 'Какая презентация была представлена на установочном организационном мероприятии?',
        answers: [
          { id: 'a1', text: 'Стратегия ДОиРП 2025', isCorrect: true },
          { id: 'a2', text: 'Финансовый отчет', isCorrect: false },
          { id: 'a3', text: 'План продаж', isCorrect: false },
          { id: 'a4', text: 'Маркетинговая стратегия', isCorrect: false }
        ],
        explanation: 'На установочном мероприятии была представлена презентация «Стратегия ДОиРП 2025».'
      },
      {
        id: 'q2',
        text: 'Сколько частей включает в себя Центр оценки?',
        answers: [
          { id: 'a1', text: '2 части', isCorrect: false },
          { id: 'a2', text: '3 части', isCorrect: true },
          { id: 'a3', text: '4 части', isCorrect: false },
          { id: 'a4', text: '5 частей', isCorrect: false }
        ],
        explanation: 'Центр оценки состоит из трех частей, проводимых в течение дня.'
      }
    ]
  },
  {
    id: 'day3-quiz',
    title: 'Итоги третьего дня',
    icon: 'star',
    maxPoints: 40,
    questions: [
      {
        id: 'q1',
        text: 'Какая основная тема рабочей сессии?',
        answers: [
          { id: 'a1', text: 'Стандарты ТСПП – обмен опытом', isCorrect: true },
          { id: 'a2', text: 'Финансовое планирование', isCorrect: false },
          { id: 'a3', text: 'Управление персоналом', isCorrect: false },
          { id: 'a4', text: 'Маркетинговые стратегии', isCorrect: false }
        ],
        explanation: 'Основная тема рабочей сессии - "Стандарты ТСПП – обмен опытом".'
      },
      {
        id: 'q2',
        text: 'Какова продолжительность тренинга на командное взаимодействие?',
        answers: [
          { id: 'a1', text: '2 часа', isCorrect: false },
          { id: 'a2', text: '3 часа', isCorrect: true },
          { id: 'a3', text: '4 часа', isCorrect: false },
          { id: 'a4', text: '5 часов', isCorrect: false }
        ],
        explanation: 'Тренинг на командное взаимодействие длится 3 часа (с 15:00 до 18:00).'
      }
    ]
  },
  {
    id: 'day4-quiz',
    title: 'Итоги четвертого дня',
    icon: 'star',
    maxPoints: 40,
    questions: [
      {
        id: 'q1',
        text: 'Какой тренинг проводится в этот день?',
        answers: [
          { id: 'a1', text: 'Основы бизнеса FMCG', isCorrect: true },
          { id: 'a2', text: 'Управление временем', isCorrect: false },
          { id: 'a3', text: 'Навыки презентации', isCorrect: false },
          { id: 'a4', text: 'Работа с клиентами', isCorrect: false }
        ],
        explanation: 'В четвертый день проводится тренинг "Основы бизнеса FMCG".'
      },
      {
        id: 'q2',
        text: 'Что представляется в первой половине дня?',
        answers: [
          { id: 'a1', text: 'Диагностическая карта (часть 1)', isCorrect: true },
          { id: 'a2', text: 'Финансовый отчет', isCorrect: false },
          { id: 'a3', text: 'План развития', isCorrect: false },
          { id: 'a4', text: 'Маркетинговая стратегия', isCorrect: false }
        ],
        explanation: 'В первой половине дня проходит презентация диагностической карты (часть 1).'
      }
    ]
  },
  {
    id: 'day5-quiz',
    title: 'Итоги пятого дня',
    icon: 'trophy',
    maxPoints: 40,
    questions: [
      {
        id: 'q1',
        text: 'Какое мероприятие завершает конференцию?',
        answers: [
          { id: 'a1', text: 'Торжественное закрытие КП', isCorrect: true },
          { id: 'a2', text: 'Финальный тест', isCorrect: false },
          { id: 'a3', text: 'Индивидуальные консультации', isCorrect: false },
          { id: 'a4', text: 'Подведение итогов', isCorrect: false }
        ],
        explanation: 'Конференция завершается торжественным закрытием КП.'
      },
      {
        id: 'q2',
        text: 'Сколько времени отведено на завтрак в последний день?',
        answers: [
          { id: 'a1', text: '30 минут', isCorrect: true },
          { id: 'a2', text: '1 час', isCorrect: false },
          { id: 'a3', text: '45 минут', isCorrect: false },
          { id: 'a4', text: '1.5 часа', isCorrect: false }
        ],
        explanation: 'В последний день на завтрак отведено 30 минут (с 8:00 до 8:30).'
      }
    ]
  }
];