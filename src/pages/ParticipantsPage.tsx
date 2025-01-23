import React, { useEffect } from 'react';
import { Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { SPEAKERS } from '../data/speakers';
import { useNavigate } from 'react-router-dom';

export function ParticipantsPage() {
  const navigate = useNavigate();
  const speakers = Object.values(SPEAKERS);

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

  return (
    <div className="space-y-6">
      <PageHeader title="Участники КП" icon={Users}>
        <p className="text-emerald-primary/80 text-sm mt-1">
          Спикеры и организаторы конференции
        </p>
      </PageHeader>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="grid gap-4">
          {speakers.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {speaker.photoUrl ? (
                  <img
                    src={speaker.photoUrl}
                    alt={speaker.name}
                    className="w-16 h-16 rounded-[1.25rem] object-cover ring-2 ring-emerald-primary/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-primary/10 flex items-center justify-center">
                    <Users className="w-8 h-8 text-emerald-primary/70" />
                  </div>
                )}
                
                <div>
                  <h3 className="font-semibold text-emerald-light">
                    {speaker.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {speaker.position}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default ParticipantsPage;