import { SPEAKERS } from './speakers';
import { SPEAKERS2 } from './speakers2';
import { SPEAKERS3 } from './speakers3';

export const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];

export const WEEKLY_SCHEDULE = {
  0: [ // Понедельник, 03 февраля
    {
      id: 'mon-2',
      time: '14:00 - 16:00',
      title: 'Трансфер в отель',
      location: 'Стоянка ТЦ "Хорошо"',
      description: 'Посадка тренеров СПП в автобус, трансфер в Конгресс-отель',
      duration: '2 ч.',
      speaker: 'katyurina'
    },
    {
      id: 'mon-3',
      time: '15:00 - 16:00',
      title: 'Подготовка организаторами КП встречи Тренеров СПП в отеле',
      description: 'Прибытие организаторов КП в Конгресс-отель',
      location: 'Отель',
      duration: '30 м.',
      speaker: 'sannikova'
    },
    {
      id: 'mon-4',
      time: '16:00 - 16:30',
      title: 'Встреча организаторами КП Тренеров СПП в отеле',
      description: 'Встреча тренеров СПП в Конгресс-отеле',
      location: 'Отель',
      duration: '30 м.',
      speaker: 'sannikova',
      speaker2: 'katyurina' // Правильное использование второго спикера
    },
    {
      id: 'mon-5',
      time: '17:30 - 17:45',
      title: 'Установочное собрание всех участников КП',
      description: 'Проведение установочного собрания для всех участников КП',
      location: 'ТЗ',
      duration: '15 м.',
      speaker: 'sokolyanskaya',
      speaker2: 'temnov'
    },
    {
      id: 'mon-6',
      time: '17:45 - 18:45',
      title: 'Общее знакомство участников КП',
      location: 'ТЗ',
      duration: '1 ч.',
      speaker: 'katyurina'
    },
    {
      id: 'mon-7',
      time: '19:00 - 20:00',
      title: 'Ужин',
      location: 'Ресторан',
      duration: '1 ч.'
    }
  ],
  1: [ // Вторник, 04 февраля
    {
      id: 'tue-1',
      time: '08:00 - 09:30',
      title: '🍳 Завтрак',
      location: 'Ресторан',
      duration: '1 ч. 30 м.'
    },
    {
      id: 'tue-2',
      time: '10:00 - 11:00',
      title: 'Установочное организационное мероприятие',
      description: 'Презентация: «Стратегия ДОиРП 2025»',
      location: 'ТЗ',
      duration: '15 м.',
      speaker: 'sokolyanskaya'
    },
    {
      id: 'tue-3',
      time: '11:00 - 12:00',
      title: 'Подведение итогов отделов ДОиРП за 2024 г. и задачи на 2025 г.',
      description: 'Подведение итогов работы отделов ДОиРП по 2024 г. цели на 2025 г.',
      location: 'ТЗ',
      duration: '1 ч.',
      speaker: 'klochkova',
      speaker2: 'uhova',
      speaker3: 'temnov'
    },
    {
      id: 'tue-4',
      time: '12:00 - 12:20',
      title: '☕️ Кофе-брейк №1',
      location: 'ТЗ',
      duration: '20 м.'
    },
    {
      id: 'tue-5',
      time: '12:20 - 14:00',
      title: 'Центр оценки',
      description: 'Проведение центра оценки ТСПП часть 1',
      location: 'ТЗ',
      duration: '1 ч. 40 м.',
      speaker: 'katyurina'
    },
    {
      id: 'tue-6',
      time: '14:00 - 15:00',
      title: '🍽 Обед',
      location: 'Ресторан',
      duration: '1 ч.'
    },
    {
      id: 'tue-7',
      time: '15:00 - 16:20',
      title: 'Центр оценки',
      description: 'Проведение центра оценки ТСПП часть 2',
      location: 'ТЗ',
      duration: '1 ч. 20 м.',
      speaker: 'katyurina'
    },
    {
      id: 'tue-8',
      time: '16:20 - 16:40',
      title: '☕️ Кофе-брейк №1',
      location: 'ТЗ',
      duration: '20 м.'
    },
    {
      id: 'tue-9',
      time: '16:40 - 18:00',
      title: 'Центр оценки',
      description: 'Проведение центра оценки ТСПП часть 3',
      location: 'ТЗ',
      duration: '1 ч. 20 м.',
      speaker: 'katyurina'
    },
    {
      id: 'tue-10',
      time: '18:00 - 18:10',
      title: '🏖 Перерыв',
      location: 'ТЗ',
      duration: '20 м.'
    }
  ],
  2: [ // Среда, 05 февраля
    {
      id: 'wed-1',
      time: '08:00 - 09:00',
      title: 'Завтрак',
      location: 'Ресторан',
      duration: '1 ч.'
    },
    {
      id: 'wed-2',
      time: '10:00 - 12:00',
      title: 'Рабочая сессия: "Стандарты ТСПП – обмен опытом"',
      location: 'ТЗ',
      duration: '2 ч.',
      speaker: 'katyurina'
    },
    {
      id: 'wed-3',
      time: '15:00 - 18:00',
      title: 'Тренинг на командное взаимодействие',
      location: 'ТЗ',
      duration: '3 ч.',
      speaker: 'Внешний провайдер'
    }
  ],
  3: [ // Четверг, 06 февраля
    {
      id: 'thu-1',
      time: '08:00 - 09:00',
      title: 'Завтрак',
      location: 'Ресторан',
      duration: '30 м.'
    },
    {
      id: 'thu-2',
      time: '10:00 - 12:00',
      title: 'Презентация диагностической карты (часть 1)',
      location: 'ТЗ',
      duration: '2 ч.',
      speaker: 'Морозов М.'
    },
    {
      id: 'thu-3',
      time: '15:00 - 16:40',
      title: 'Тренинг: "Основы бизнеса FMCG"',
      location: 'ТЗ',
      duration: '1 ч. 40 м.',
      speaker: 'Соколянская Т.'
    }
  ],
  4: [ // Пятница, 07 февраля
    {
      id: 'fri-1',
      time: '08:00 - 08:30',
      title: 'Завтрак',
      location: 'Ресторан',
      duration: '30 м.'
    },
    {
      id: 'fri-2',
      time: '10:00 - 12:00',
      title: 'Торжественное закрытие КП',
      location: 'ТЗ',
      duration: '2 ч.',
      speaker: 'Соколянская Т., Темнов Г.'
    }
  ]
};
