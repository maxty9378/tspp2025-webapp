import React, { useState, useEffect } from 'react';
import { Trophy, Users, Play, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { sendMessageToGroup } from '../../lib/telegramBot';
import { showNotification } from '../../utils/notifications';
import { Team, MazeGame } from '../../types/game';
import { UserProfile } from '../../types';
import { TeamCard } from './maze/TeamCard';
import { GameControls } from './maze/GameControls';
import { NoGame } from './maze/NoGame';

const MAZE_GAME_STORAGE_KEY = 'current_maze_game';
const POINTS_PER_LEVEL = 50;
const TEAM_NAMES = ['Красные', 'Синие', 'Зелёные', 'Жёлтые'];

export function MazeGameControl() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentGame, setCurrentGame] = useState<MazeGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamsLocked, setTeamsLocked] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('first_name');
      if (data) setUsers(data);
    };

    const restoreGameState = async () => {
      try {
        const { data } = await supabase
          .from('maze_games')
          .select('*')
          .eq('active', true)
          .single();

        if (data) {
          setCurrentGame(data);
          setTeamsLocked(Boolean(data.teams_locked));
          localStorage.setItem(MAZE_GAME_STORAGE_KEY, JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error restoring game state:', error);
      }
    };

    Promise.all([fetchUsers(), restoreGameState()]).finally(() => setLoading(false));

    // Subscribe to game updates
    const subscription = supabase
      .channel('maze_games')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maze_games' },
        () => restoreGameState()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      const teams: Team[] = TEAM_NAMES.map(name => ({
        id: crypto.randomUUID(),
        name,
        members: [],
        score: 0,
        level: 0
      }));

      const game: MazeGame = {
        id: crypto.randomUUID(),
        active: true,
        teams,
        started_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('maze_games')
        .insert([game]);

      if (error) throw error;

      setCurrentGame(game);
      localStorage.setItem(MAZE_GAME_STORAGE_KEY, JSON.stringify(game));
      
      await sendMessageToGroup('🎮 Началась игра "Лабиринт"!\n\n👥 4 команды будут соревноваться в прохождении уровней.\n\n💫 За каждый пройденный уровень команда получает баллы.\n\n🎯 Администратор распределяет участников по командам.', 'admin');
      
      showNotification({
        title: 'Игра начата',
        message: 'Распределите участников по командам',
        type: 'success'
      });
    } catch (error) {
      console.error('Error starting game:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось начать игру',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    if (!currentGame) return;

    setLoading(true);
    try {
      const { data: latestGame, error: fetchError } = await supabase
        .from('maze_games')
        .select('*')
        .eq('id', currentGame.id)
        .single();

      if (fetchError) throw fetchError;
      if (!latestGame) throw new Error('Game not found');

      // Calculate points before updating game status
      const teamUpdates = [];
      for (const team of latestGame.teams) {
        const totalPoints = team.level * POINTS_PER_LEVEL;
        if (totalPoints <= 0 || !team.members.length) continue;

        teamUpdates.push({
          members: team.members,
          points: totalPoints
        });
      }

      // Update game status
      const { error: updateError } = await supabase
        .from('maze_games')
        .update({
          active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', currentGame.id);

      if (updateError) throw updateError;

      // Award points to team members
      await Promise.all(teamUpdates.map(async ({ members, points }) => {
        return supabase
          .rpc('increment_user_points', {
            user_ids: members,
            points_to_add: points
          });
      }));

      setCurrentGame(null);
      localStorage.removeItem(MAZE_GAME_STORAGE_KEY);
      
      // Send game results to Telegram group
      const results = latestGame.teams.map(team => {
        const points = team.level * POINTS_PER_LEVEL;
        return `${team.name}: Уровень ${team.level} (${points} баллов)${
          team.members.length ? ` • ${team.members.length} участников` : ''
        }`;
      }).join('\n');
        
      await sendMessageToGroup(`🏁 Игра "Лабиринт" завершена!\n\n📊 Результаты:\n${results}`, 'admin');
      
      showNotification({
        title: 'Игра завершена',
        message: 'Все баллы начислены участникам',
        type: 'success'
      });

    } catch (error) {
      console.error('Error ending game:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось завершить игру',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLockTeams = async () => {
    if (!currentGame) return;
    
    try {
      const { error } = await supabase
        .from('maze_games')
        .update({ teams_locked: true })
        .eq('id', currentGame.id);

      if (error) throw error;

      setTeamsLocked(true);
      const updatedGame = { ...currentGame, teams_locked: true };
      setCurrentGame(updatedGame);
      localStorage.setItem(MAZE_GAME_STORAGE_KEY, JSON.stringify(updatedGame));
      
      // Send notification to Telegram group
      const teamSummary = currentGame.teams
        .map(team => `${team.name}: ${team.members.length} участников`)
        .join('\n');
        
      await sendMessageToGroup(`🔒 Команды сформированы!\n\n${teamSummary}`, 'admin');
      
      showNotification({
        title: 'Команды зафиксированы',
        message: 'Теперь состав команд не может быть изменен',
        type: 'success'
      });
    } catch (error) {
      console.error('Error locking teams:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось зафиксировать команды',
        type: 'error'
      });
    }
  };

  const handleAddUserToTeam = async (userId: string, teamId: string) => {
    if (!currentGame || teamsLocked) return;

    const updatedTeams = currentGame.teams.map(team => {
      if (team.id === teamId) {
        return { ...team, members: [...team.members, userId] };
      }
      return {
        ...team,
        members: team.members.filter(id => id !== userId)
      };
    });

    try {
      const { error } = await supabase
        .from('maze_games')
        .update({ teams: updatedTeams })
        .eq('id', currentGame.id);

      if (error) throw error;

      setCurrentGame({ ...currentGame, teams: updatedTeams });
      localStorage.setItem(MAZE_GAME_STORAGE_KEY, JSON.stringify({
        ...currentGame,
        teams: updatedTeams
      }));
    } catch (error) {
      console.error('Error updating team:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить команду',
        type: 'error'
      });
    }
  };

  const handleUpdateTeamLevel = async (teamId: string, increment: boolean) => {
    if (!currentGame) return;

    const updatedTeams = currentGame.teams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          level: Math.max(0, team.level + (increment ? 1 : -1))
        };
      }
      return team;
    });

    try {
      const { error } = await supabase
        .from('maze_games')
        .update({ teams: updatedTeams })
        .eq('id', currentGame.id);

      if (error) throw error;

      setCurrentGame({ ...currentGame, teams: updatedTeams });
      localStorage.setItem(MAZE_GAME_STORAGE_KEY, JSON.stringify({
        ...currentGame,
        teams: updatedTeams
      }));
    } catch (error) {
      console.error('Error updating team level:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить уровень команды',
        type: 'error'
      });
    }
  };

  if (!currentGame) {
    return <NoGame onStart={handleStartGame} loading={loading} />;
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <GameControls
          currentGame={currentGame}
          teamsLocked={teamsLocked}
          onEndGame={handleEndGame}
          onLockTeams={handleLockTeams}
          loading={loading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentGame.teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              users={users}
              teamsLocked={teamsLocked}
              onAddUser={(userId) => handleAddUserToTeam(userId, team.id)}
              onUpdateLevel={(increment) => handleUpdateTeamLevel(team.id, increment)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default MazeGameControl;