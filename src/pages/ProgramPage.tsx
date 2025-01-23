import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS } from '../data/programSchedule';
import { SpeakerCard } from '../components/SpeakerCard';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { usePrograms } from '../hooks/usePrograms';
import { useNavigate } from 'react-router-dom';

export function ProgramPage() {
  const navigate = useNavigate();
  const today = new Date();
  const currentDayIndex = today.getDay() - 1; // 0 for Monday, 4 for Friday
  const [selectedDay, setSelectedDay] = useState(
    currentDayIndex >= 0 && currentDayIndex < 5 ? currentDayIndex : 0
  );
  const { programs, loading } = usePrograms();

  const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();
  const todaySchedule = programs[currentDayIndex] || [];
  const selectedSchedule = programs[selectedDay] || [];

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate('/');
        if (tg.HapticFeedback) {
          tg.HapticFeedback.impactOccurred('light');
        }
      });
    }

    return () => {
      if (tg?.BackButton) {
        tg.BackButton.offClick();
        tg.BackButton.hide();
      }
    };
  }, [navigate]);

  useEffect(() => {
    // Find current event
    const currentEvent = todaySchedule.find(event => {
      const startTime = new Date(`1970-01-01T${event.time_start}`).getHours() * 60 + 
                       new Date(`1970-01-01T${event.time_start}`).getMinutes();
      const endTime = new Date(`1970-01-01T${event.time_end}`).getHours() * 60 + 
                     new Date(`1970-01-01T${event.time_end}`).getMinutes();
      return currentTimeInMinutes >= startTime && currentTimeInMinutes < endTime;
    });

    if (currentEvent) {
      const eventElement = document.getElementById(currentEvent.id);
      if (eventElement) {
        eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const handlePrevDay = () => {
    setSelectedDay(prev => (prev > 0 ? prev - 1 : 4));
  };

  const handleNextDay = () => {
    setSelectedDay(prev => (prev < 4 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Программа" icon={Calendar}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-emerald-primary/80 text-sm mt-1">
            Расписание мероприятий
          </p>
          {currentDayIndex === selectedDay && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-amber-300 font-medium"
            >
              {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </motion.div>
          )}
        </div>
      </PageHeader>

      <motion.div 
        className="card p-4 bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-emerald-500/10 border border-emerald-500/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between gap-2">
          <motion.button 
            onClick={handlePrevDay}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 text-center">
            <div className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              {WEEKDAYS[selectedDay]}
            </div>
            <div className="text-sm text-emerald-300/80 font-medium mt-0.5">
              {new Date(today.setDate(today.getDate() - today.getDay() + selectedDay + 1))
                .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
          </div>

          <motion.button 
            onClick={handleNextDay}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      <div className="space-y-4">
        {loading ? (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-emerald-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-slate-400 mt-4 font-medium">Загрузка расписания...</p>
          </motion.div>
        ) : selectedSchedule.length > 0 ? (
          <AnimatePresence mode="wait">
            {selectedSchedule.map((event, index) => {
            const status = currentDayIndex === selectedDay ? 
              currentTimeInMinutes >= new Date(`1970-01-01T${event.time_start}`).getHours() * 60 + 
                                    new Date(`1970-01-01T${event.time_start}`).getMinutes() && 
              currentTimeInMinutes < new Date(`1970-01-01T${event.time_end}`).getHours() * 60 + 
                                   new Date(`1970-01-01T${event.time_end}`).getMinutes() ? 'current' :
              currentTimeInMinutes < new Date(`1970-01-01T${event.time_start}`).getHours() * 60 + 
                                   new Date(`1970-01-01T${event.time_start}`).getMinutes() ? 'upcoming' : 'past' : 'other';

            const isBreak = event.title.toLowerCase().includes('кофе-брейк') || 
                           event.title.toLowerCase().includes('обед') ||
                           event.title.toLowerCase().includes('ужин') ||
                           event.title.toLowerCase().includes('завтрак');

            if (isBreak) {
              return (
                <motion.div 
                  key={event.id}
                  id={event.id}
                  className="card p-3 bg-gradient-to-br from-blue-500/5 to-blue-600/10 border border-blue-500/20 flex items-center justify-between hover:from-blue-500/10 hover:to-blue-600/15 transition-all duration-300 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Background Icons */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    {/* Top row */}
                    <div className="absolute -right-2 -top-2 transform rotate-12">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">☕️</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🍽</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🍴</div>
                      ) : (
                        <div className="text-2xl">🍳</div>
                      )}
                    </div>
                    <div className="absolute right-8 top-1 transform rotate-6">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🫖</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥗</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🍲</div>
                      ) : (
                        <div className="text-2xl">🥐</div>
                      )}
                    </div>
                    <div className="absolute right-16 -top-1 transform -rotate-12">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🍪</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥘</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🥩</div>
                      ) : (
                        <div className="text-2xl">🥖</div>
                      )}
                    </div>
                    
                    {/* Middle row */}
                    <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 rotate-6">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🧁</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥪</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🥂</div>
                      ) : (
                        <div className="text-2xl">🥨</div>
                      )}
                    </div>
                    <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 -rotate-12">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🍰</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥤</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🍷</div>
                      ) : (
                        <div className="text-2xl">🥛</div>
                      )}
                    </div>
                    
                    {/* Bottom row */}
                    <div className="absolute -left-2 -bottom-2 transform -rotate-12">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🍩</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🍚</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🍖</div>
                      ) : (
                        <div className="text-2xl">🥯</div>
                      )}
                    </div>
                    <div className="absolute left-8 bottom-1 transform rotate-12">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🥮</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥙</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🍗</div>
                      ) : (
                        <div className="text-2xl">🥞</div>
                      )}
                    </div>
                    <div className="absolute left-16 -bottom-1 transform -rotate-6">
                      {event.title.toLowerCase().includes('кофе') ? (
                        <div className="text-2xl">🍪</div>
                      ) : event.title.toLowerCase().includes('обед') ? (
                        <div className="text-2xl">🥑</div>
                      ) : event.title.toLowerCase().includes('ужин') ? (
                        <div className="text-2xl">🥃</div>
                      ) : (
                        <div className="text-2xl">🧇</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-lg">
                      {event.title.toLowerCase().includes('кофе') ? '☕️' : 
                       event.title.toLowerCase().includes('обед') ? '🍽' :
                       event.title.toLowerCase().includes('ужин') ? '🍴' : '🍳'}
                    </div>
                    <span className="text-blue-300 font-medium text-base">{event.title}</span>
                  </div>
                  <span className="text-sm text-blue-300 font-medium bg-blue-500/10 px-3 py-1 rounded-lg">
                    {`${event.time_start.slice(0, 5)} - ${event.time_end.slice(0, 5)}`}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div 
                key={event.id}
                id={event.id}
                className={`card p-4 transition-all duration-300 bg-gradient-to-br ${
                  index % 2 === 0
                    ? 'from-slate-800/40 via-slate-800/30 to-slate-900/40 hover:from-slate-800/50 hover:via-slate-800/40 hover:to-slate-900/50'
                    : 'from-slate-900/40 via-slate-800/30 to-slate-800/40 hover:from-slate-900/50 hover:via-slate-800/40 hover:to-slate-800/50'
                } ${
                  status === 'current' ? 'ring-2 ring-emerald-primary/50 bg-emerald-primary/5' :
                  status === 'past' ? 'opacity-60' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <motion.span 
                    className="text-emerald-light font-medium px-3 py-1 bg-emerald-primary/10 rounded-lg text-sm"
                    whileHover={{ scale: 1.05 }}
                  >
                    {`${event.time_start.slice(0, 5)} - ${event.time_end.slice(0, 5)}`}
                  </motion.span>
                  {status === 'current' && (
                    <motion.span 
                      className="px-3 py-1 text-xs font-medium bg-emerald-primary/10 text-emerald-light rounded-lg"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Сейчас
                    </motion.span>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-medium text-emerald-light">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-slate-400 mt-1.5 leading-snug">{event.description}</p>
                    )}
                  </div>
                   
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-slate-400 w-fit">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs">{event.location}</span>
                    </div>
                  )}

                  {event.speakers && event.speakers.length > 0 && (
                    <div className="space-y-2 pt-3 mt-3 border-t border-slate-700/30">
                      {event.speakers?.map((speaker, index) => (
                        <div key={speaker.id}>
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                            className="bg-slate-800/40 rounded-lg border border-slate-700/30 hover:bg-slate-800/60 transition-all duration-300"
                          >
                            <SpeakerCard
                              name={`${speaker.first_name} ${speaker.last_name || ''}`}
                              position={speaker.position || ''}
                              photoUrl={speaker.photo_url}
                            />
                          </motion.div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        ) : (
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 font-medium">
            Нет запланированных мероприятий
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ProgramPage;