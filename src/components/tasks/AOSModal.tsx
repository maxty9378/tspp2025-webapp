import React, { useState } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { hapticFeedback } from '../../utils/telegram';

interface AOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: string;
  programTitle: string;
  userId: string;
  onComplete: () => void;
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

export function AOSModal({ isOpen, onClose, programId, programTitle, userId, onComplete }: AOSModalProps) {
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
      // First store detailed AOS response
      const { error: responseError } = await supabase
        .from('aos_responses')
        .upsert({
          user_id: userId,
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

      onComplete();
      onClose();
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-700/30 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
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
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Ratings */}
              <div className="space-y-4">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}