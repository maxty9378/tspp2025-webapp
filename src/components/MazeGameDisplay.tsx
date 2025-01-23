import React, { useEffect, useState } from 'react';
import { Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { supabase } from '../lib/supabase';
import { MazeGame, Team } from '../types/game';
import { UserProfile } from '../types';

interface MazeGameDisplayProps {
  currentUser: UserProfile;
}

const POINTS_PER_LEVEL = 50;
const TEAM_COLORS = {
  'Красные': 'bg-red-500/20 border-red-500/30 text-red-300',
  'Синие': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  'Зелёные': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  'Жёлтые': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
};

export function MazeGameDisplay({ currentUser }: MazeGameDisplayProps) {
  const [currentGame, setCurrentGame] = useState<MazeGame | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCurrentGame = async () => {
      try {
        const { data: games, error: fetchError } = await supabase
          .from('maze_games')
          .select(`
            id,
            active,
            teams,
            teams_locked,
            started_at,
            ended_at,
            updated_at
          `)
          .eq('active', true)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('Error fetching game:', fetchError);
          return;
        }
        
        setCurrentGame(games?.[0] || null);
      } catch (error) {
        console.error('Unexpected error fetching game:', error);
        setCurrentGame(null); 
      }
    };

    fetchCurrentGame();

    // Subscribe to game updates
    const subscription = supabase
      .channel('maze_games')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'maze_games'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && 
              !payload.new.active && payload.old?.active) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
          fetchCurrentGame();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!currentGame) return null;

  const userTeam = currentGame.teams.find(team => 
    team.members.includes(currentUser.id)
  );

  const totalPoints = userTeam ? userTeam.level * POINTS_PER_LEVEL : 0;

  return (
    <motion.div 
      key={currentGame.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card p-4"
    > 
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Игра "Лабиринт"</h3>
          {userTeam ? (
            <p className="text-sm text-emerald-primary/80">
              Ваша команда: {userTeam.name} • Уровень {userTeam.level} • {totalPoints} баллов
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              {currentGame.teamsLocked ? 
                'Вы не участвуете в игре' : 
                'Администратор распределяет участников по командам'
              }
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {currentGame.teams.map(team => (
          <div 
            key={team.id}
            className={`p-3 rounded-lg ${
              TEAM_COLORS[team.name as keyof typeof TEAM_COLORS]
            } ${userTeam?.id === team.id ? 'ring-2 ring-white/20' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {team.name}
              </span>
              <div className="flex items-center gap-1 text-slate-400">
                <Users className="w-4 h-4" />
                <span>{team.members.length}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Уровень {team.level}
              </div>
              <div className="text-sm font-medium">
                {team.level * POINTS_PER_LEVEL} баллов
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}