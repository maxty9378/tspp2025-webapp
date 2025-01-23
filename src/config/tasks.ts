import { Trophy, MessageSquare, Camera, Users, Star, BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TaskCategory {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: LucideIcon;
  type: 'daily' | 'story' | 'offline';
  hashtag?: string;
}

export const TASK_CATEGORIES: TaskCategory[] = [
  // Daily Tasks
  {
    id: 'greeting',
    title: 'Приветствие/Цитата дня',
    description: 'Представьтесь или поделитесь вдохновляющей цитатой',
    points: 10,
    icon: MessageSquare,
    type: 'daily'
  },
  {
    id: 'slogan',
    title: 'Слоган',
    description: 'Придумайте слоган для конференции',
    points: 10,
    icon: MessageSquare,
    type: 'daily'
  },
  {
    id: 'coins',
    title: 'DOIRP Coins',
    description: 'Заработайте 1000 DOIRP Coins+',
    points: 10,
    icon: Trophy,
    type: 'daily'
  },
  {
    id: 'likes',
    title: 'Лайки',
    description: 'Поставьте 2 лайка другим участникам',
    points: 10,
    icon: Star,
    type: 'daily'
  },
  {
    id: 'surveys',
    title: 'Тесты',
    description: 'Пройдите 3 теста',
    points: 15,
    icon: BookOpen,
    type: 'daily'
  },

  // Story Tasks
  {
    id: 'speaker_story',
    title: 'Фото со спикером',
    description: 'Опубликуйте фото со спикером',
    points: 50,
    icon: Camera,
    type: 'story',
    hashtag: '#ЯиСпикер'
  },
  {
    id: 'team_story',
    title: 'Командное фото',
    description: 'Опубликуйте фото с командой',
    points: 20,
    icon: Users,
    type: 'story',
    hashtag: '#МояКоманда'
  },
  {
    id: 'success_story',
    title: 'История успеха',
    description: 'Поделитесь своей историей успеха',
    points: 30,
    icon: Trophy,
    type: 'story',
    hashtag: '#МойУспех'
  },

  // Offline Tasks
  {
    id: 'share_experience',
    title: 'Поделитесь опытом',
    description: 'Расскажите случай из практики с хорошими результатами',
    points: 50,
    icon: MessageSquare,
    type: 'offline'
  },
  {
    id: 'share_lesson',
    title: 'Поделитесь уроком',
    description: 'Расскажите о допущенной ошибке и чему она научила',
    points: 50,
    icon: MessageSquare,
    type: 'offline'
  }
];