import React, { useState } from 'react';
import { UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useTaskCompletions } from '../hooks/useTaskCompletions';
import { showNotification } from '../utils/notifications';
import { motion } from 'framer-motion';
import { MessageSquare, Camera, Trophy, Heart, Coins, BookOpen } from 'lucide-react';

// Import components
import { GreetingTasks } from './tasks/GreetingTasks';
import { CoinsTask } from './tasks/CoinsTask';
import { SurveysTask } from './tasks/SurveysTask';
import { PhotoTasks } from './tasks/PhotoTasks';
import { ExperienceTasks } from './tasks/ExperienceTasks';
import { CustomTask } from './tasks/CustomTask';
import { AOSList } from './tasks/AOSList';
import { useAOS } from '../hooks/useAOS';
import { ExperienceShareModal } from './ExperienceShareModal';

interface DailyTaskProps {
  user: UserProfile;
}

export function DailyTask({ user }: DailyTaskProps) {
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [selectedTaskType, setSelectedTaskType] = useState<'practice' | 'mistake' | null>(null);
  const navigate = useNavigate();
  const { completions, removeTaskCompletion } = useTaskCompletions();
  const [isRemoving, setIsRemoving] = useState(false);
  const { programs: aosPrograms, loading: aosLoading } = useAOS();
  const { tasks } = useTasks();

  const handleRemoveCompletion = async (completionId: string) => {
    try {
      setIsRemoving(true);
      const success = await removeTaskCompletion(completionId);

      if (success) {
        showNotification({
          title: 'Успешно',
          message: 'Отметка о выполнении удалена',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error removing completion:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить отметку о выполнении',
        type: 'error'
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const handleTaskClick = (taskType: 'greeting' | 'coins' | 'likes' | 'surveys' | 'tests' | 'speaker_story' | 'slogan' | 'practice' | 'mistake' | 'participants_story') => {
    switch (taskType) {
      case 'practice':
      case 'mistake':
        setSelectedTaskType(taskType);
        setShowExperienceModal(true);
        break;
      case 'coins':
        navigate('/power-up', { replace: true });
        break;
      case 'likes':
        navigate('/users');
        break;
      case 'surveys':
      case 'tests':
        navigate('/tests');
        break;
      case 'speaker_story':
        fileInputRef.current?.click();
        break;
      case 'participants_story':
        participantsPhotoInputRef.current?.click();
        break;
    }

    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  // Calculate task completion states
  const hasPostedSpeakerStory = Boolean(user.speaker_story_posted);
  const hasEarnedCoins = Boolean(user.total_coins_earned >= 1000);
  const likesGiven = (user.likes || []).length;
  const hasGivenLikes = likesGiven >= 2;
  const completedSurveys = user.completed_surveys || 0;
  const hasCompletedSurveys = completedSurveys >= 3;
  const hasGreeting = Boolean(user.greeting_message);
  const hasSlogan = Boolean(user.slogan);
  const hasQuote = completions.daily?.some(c => 
    c.metadata?.type === 'quote' && c.user?.id === user.id
  );
  const hasCompletedGreetingTasks = hasGreeting && hasSlogan && hasQuote;
  const hasCompletedPractice = completions.daily?.some(c => 
    c.metadata?.type === 'practice' && c.metadata?.first_time === 'true'
  );
  const hasCompletedMistake = completions.daily?.some(c => 
    c.metadata?.type === 'mistake' && c.metadata?.first_time === 'true'
  );

  // Task sections with consistent styling
  const sections = [
    {
      id: 'communication',
      title: 'Общение',
      description: 'Делитесь мыслями и впечатлениями',
      icon: MessageSquare,
      color: 'emerald',
      components: [
        <GreetingTasks 
          key="greeting"
          user={user} 
          hasCompletedGreetingTasks={hasCompletedGreetingTasks} 
        />
      ]
    },
    {
      id: 'activity',
      title: 'Активность',
      description: 'Участвуйте в мероприятиях',
      icon: Camera,
      color: 'indigo',
      components: [
        <PhotoTasks
          key="photos"
          user={user}
          hasPostedSpeakerStory={hasPostedSpeakerStory}
        />
      ]
    },
    {
      id: 'experience',
      title: 'Опыт',
      description: 'Делитесь знаниями',
      icon: BookOpen,
      color: 'amber',
      components: [
        <ExperienceTasks
          key="experience"
          hasCompletedPractice={hasCompletedPractice}
          hasCompletedMistake={hasCompletedMistake}
          onTaskClick={handleTaskClick}
        />
      ]
    },
    {
      id: 'engagement',
      title: 'Вовлеченность',
      description: 'Взаимодействуйте с другими',
      icon: Heart,
      color: 'rose',
      components: [
        <CoinsTask
          key="coins"
          user={user}
          hasEarnedCoins={hasEarnedCoins}
          onClick={() => handleTaskClick('coins')}
        />,
        <SurveysTask
          key="surveys"
          completedSurveys={completedSurveys}
          hasCompletedSurveys={hasCompletedSurveys} 
        />
      ]
    }
  ];

  return (
    <>
      {sections.map((section) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg bg-${section.color}-500/10 flex items-center justify-center`}>
              <section.icon className={`w-5 h-5 text-${section.color}-400`} />
            </div>
            <div>
              <h3 className={`font-medium text-${section.color}-300`}>{section.title}</h3>
              <p className="text-sm text-slate-400">{section.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            {section.components}
          </div>
        </motion.div>
      ))}

      {/* AOS List */}
      {!aosLoading && aosPrograms.length > 0 && (
        <AOSList
          userId={user.id}
          programs={aosPrograms}
        />
      )}

      {tasks.length > 0 && (
        <>
          <div className="mt-8 mb-4">
            <h3 className="text-lg font-medium text-indigo-300">Специальные задания</h3>
            <p className="text-sm text-slate-400">Задания с повышенными баллами</p>
          </div>
          
          <div className="space-y-4">
            {tasks.filter(task => task.type !== 'aos').map(task => (
              <CustomTask
                key={task.id}
                task={task}
                isCompleted={completions[task.type]?.some(c => 
                  c.metadata?.task_id === task.id && c.user?.id === user.id
                )}
                completions={completions[task.type]?.filter(c => 
                  c.metadata?.task_id === task.id
                ) || []}
                onRemoveCompletion={handleRemoveCompletion}
                userId={user.id}
              />
            ))}
          </div>
        </>
      )}
      
      {/* Experience Share Modal */}
      {selectedTaskType && (
        <ExperienceShareModal
          isOpen={showExperienceModal}
          onClose={() => {
            setShowExperienceModal(false);
            setSelectedTaskType(null);
          }}
          type={selectedTaskType}
          userId={user.id}
        />
      )}
    </>
  );
}