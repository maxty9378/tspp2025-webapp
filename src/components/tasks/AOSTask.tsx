import React, { useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { hapticFeedback } from '../../utils/telegram';

interface AOSTaskProps {
  programId: string;
  programTitle: string;
  userId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface AOSFormData {
  ratings: {
    knowledge: number;
    practicalValue: number;
    interest: number;
    clarity: number;
    materials: number;
    individualApproach: number;
    dynamics: number;
    answers: number;
    overall: number;
  };
  feedback: {
    memorableTopics: string;
    planToApply: string;
    generalImpressions: string;
    wishes: string;
  };
}

const INITIAL_FORM_DATA: AOSFormData = {
  ratings: {
    knowledge: 0,
    practicalValue: 0,
    interest: 0,
    clarity: 0,
    materials: 0,
    individualApproach: 0,
    dynamics: 0,
    answers: 0,
    overall: 0
  },
  feedback: {
    memorableTopics: '',
    planToApply: '',
    generalImpressions: '',
    wishes: ''
  }
};

export function AOSTask({ programId, programTitle, userId, onComplete, onCancel }: AOSTaskProps) {
  const [formData, setFormData] = useState<AOSFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (field: keyof AOSFormData['ratings'], value: number) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [field]: value
      }
    }));
  };

  const handleFeedbackChange = (field: keyof AOSFormData['feedback'], value: string) => {
    setFormData(prev => ({
      ...prev,
      feedback: {
        ...prev.feedback,
        [field]: value
      }
    }));
  };

  const isFormValid = () => {
    // Check if all ratings are filled
    const allRatingsFilled = Object.values(formData.ratings).every(rating => rating > 0);
    // Check if at least one feedback field is filled
    const hasFeedback = Object.values(formData.feedback).some(text => text.trim().length > 0);
    return allRatingsFilled && hasFeedback;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      showNotification({
        title: 'Ошибка',
        message: 'Пожалуйста, заполните все оценки и хотя бы одно поле отзыва',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create task completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: userId,
          task_type: 'aos',
          points_awarded: 30,
          metadata: {
            program_id: programId,
            program_title: programTitle,
            ratings: formData.ratings,
            feedback: formData.feedback,
            completed_at: new Date().toISOString()
          }
        });

      if (completionError) throw completionError;

      hapticFeedback('success');
      showNotification({
        title: 'АОС заполнена',
        message: 'Спасибо за ваш отзыв! (+30 баллов)',
        type: 'success'
      });

      onComplete();
    } catch (error) {
      console.error('Error submitting AOS:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось отправить АОС',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRatingInput = (
    field: keyof AOSFormData['ratings'],
    label: string
  ) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-300">{label}</label>
        <span className="text-sm font-medium text-emerald-light">
          {formData.ratings[field] || '—'}
        </span>
      </div>
      <div className="flex gap-2">
        {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(value => (
          <button
            key={value}
            onClick={() => handleRatingChange(field, value)}
            className={`w-8 h-8 rounded-lg transition-colors ${
              formData.ratings[field] === value
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="card p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-emerald-primary" />
          </div>
          <div>
            <h3 className="font-medium text-emerald-light">
              Анкета обратной связи
            </h3>
            <p className="text-sm text-slate-400">
              {programTitle}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-slate-800/50"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Ratings */}
        <div className="space-y-4">
          {renderRatingInput('knowledge', 'Знание преподаваемого материала')}
          {renderRatingInput('practicalValue', 'Умение увязать теорию с практической деятельностью')}
          {renderRatingInput('interest', 'Умение пробудить интерес')}
          {renderRatingInput('clarity', 'Умение доступно изложить материал')}
          {renderRatingInput('materials', 'Наглядность материала')}
          {renderRatingInput('individualApproach', 'Индивидуальный подход')}
          {renderRatingInput('dynamics', 'Степень динамичности проведения практического занятия')}
          {renderRatingInput('answers', 'Насколько тренер смог исчерпывающе ответить на вопросы')}
          {renderRatingInput('overall', 'Общая оценка работы тренера')}
        </div>

        {/* Feedback */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Какие темы, методики, инструменты запомнились Вам больше всего?
            </label>
            <textarea
              value={formData.feedback.memorableTopics}
              onChange={(e) => handleFeedbackChange('memorableTopics', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none h-24"
              placeholder="Опишите наиболее запомнившиеся моменты..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Что из данного практического занятия вы будете применять в ближайший месяц?
            </label>
            <textarea
              value={formData.feedback.planToApply}
              onChange={(e) => handleFeedbackChange('planToApply', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none h-24"
              placeholder="Опишите планы по применению..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Напишите Ваши общие впечатления о практическом занятии и работе тренера
            </label>
            <textarea
              value={formData.feedback.generalImpressions}
              onChange={(e) => handleFeedbackChange('generalImpressions', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none h-24"
              placeholder="Поделитесь вашими впечатлениями..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Пожелания тренеру
            </label>
            <textarea
              value={formData.feedback.wishes}
              onChange={(e) => handleFeedbackChange('wishes', e.target.value)}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 resize-none h-24"
              placeholder="Напишите ваши пожелания..."
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid()}
          className="w-full px-4 py-2 rounded-lg bg-emerald-primary/20 text-emerald-light hover:bg-emerald-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-emerald-light/30 border-t-emerald-light rounded-full animate-spin" />
              Отправка...
            </>
          ) : (
            'Отправить АОС'
          )}
        </motion.button>
      </div>
    </div>
  );
}