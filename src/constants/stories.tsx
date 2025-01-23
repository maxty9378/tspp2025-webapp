import { Camera, Users, Star } from 'lucide-react';

export const STORY_HASHTAGS = [
  {
    tag: '#ЯиСпикер',
    title: 'Я и спикер',
    description: 'Поделитесь фото со спикером',
    icon: <Camera className="w-5 h-5 text-emerald-primary" />
  },
  {
    tag: '#МояКоманда',
    title: 'Моя команда',
    description: 'Расскажите о своей команде',
    icon: <Users className="w-5 h-5 text-emerald-primary" />
  },
  {
    tag: '#МойУспех',
    title: 'Мой успех',
    description: 'Поделитесь своими достижениями',
    icon: <Star className="w-5 h-5 text-emerald-primary" />
  }
];