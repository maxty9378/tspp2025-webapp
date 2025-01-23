import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { PageHeader } from '../components/PageHeader';
import { supabase } from '../lib/supabase';
import { showNotification } from '../utils/notifications';
import { hapticFeedback } from '../utils/telegram';
import { LoadingScreen } from '../components/LoadingScreen';

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

export function AOSPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile(window.Telegram?.WebApp?.initDataUnsafe?.user || null);
  const [formData, setFormData] = useState<AOSFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!profile || !programId) {
    return <LoadingScreen />;
  }

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
      // First store detailed AOS response
      const { error: responseError } = await supabase
        .from('aos_responses')
        .upsert({
          user_id: profile.id,
          program_id: programId,
          ratings: formData.ratings,
          feedback: formData.feedback
        });

      if (responseError) {
        throw responseError;
      }

      // Create task completion record
      const { error: completionError } = await supabase
        .from('task_completions')
        .insert({
          user_id: profile.id,
          task_type: 'aos',
          points_awarded: 30,
          metadata: {
            program_id: programId,
            ratings: formData.ratings,
            feedback: formData.feedback,
            completed_at: new Date().toISOString()
          }
        });

      if (completionError) {
        if (completionError.code === '23505' || completionError.message?.includes('already completed')) {
          showNotification({
            title: 'АОС уже заполнена',
            message: 'Вы уже заполняли АОС для этой программы',
            type: 'warning'
          });
          return;
        }
        throw completionError;
      }

      hapticFeedback('success');
      showNotification({
        title: 'АОС заполнена',
        message: 'Спасибо за ваш отзыв! (+30 баллов)',
        type: 'success'
      });

      // Navigate back to tasks page
      navigate('/tasks');

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

  return (
    <div className="space-y-6">
      <PageHeader title="Анкета обратной связи" icon={ClipboardCheck}>
        <p className="text-emerald-primary/80 text-sm mt-1">
          Оцените эффективность активного семинара и работу тренера
        </p>
      </PageHeader>

      <div className="space-y-6">
        {/* Ratings */}
        <div className="card p-4 space-y-4">
          <h3 className="text-lg font-medium text-emerald-light mb-4">Оценки</h3>
          {[
            { field: 'knowledge', label: 'Знание преподаваемого материала' },
            { field: 'practicalValue', label: 'Умение увязать теорию с практической деятельностью' },
            { field: 'interest', label: 'Умение пробудить интерес' },
            { field: 'clarity', label: 'Умение доступно изложить материал' },
            { field: 'materials', label: 'Наглядность материала' },
            { field: 'individualApproach', label: 'Индивидуальный подход' },
            { field: 'dynamics', label: 'Степень динамичности проведения практического занятия' },
            { field: 'answers', label: 'Насколько тренер смог исчерпывающе ответить на вопросы' },
            { field: 'overall', label: 'Общая оценка работы тренера' }
          ].map(({ field, label }) => (
            <div key={field} className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-300">{label}</label>
                <span className="text-sm font-medium text-emerald-light">
                  {formData.ratings[field as keyof AOSFormData['ratings']] || '—'}
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(value => (
                  <button
                    key={value}
                    onClick={() => handleRatingChange(field as keyof AOSFormData['ratings'], value)}
                    className={`w-8 h-8 rounded-lg transition-colors ${
                      formData.ratings[field as keyof AOSFormData['ratings']] === value
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="card p-4 space-y-4">
          <h3 className="text-lg font-medium text-emerald-light mb-4">Отзывы</h3>
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

export default AOSPage;