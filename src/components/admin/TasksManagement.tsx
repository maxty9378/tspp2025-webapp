import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { useTaskCompletions } from '../../hooks/useTaskCompletions';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'daily' | 'achievement' | 'story';
  created_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  photo_url?: string;
}

export function TasksManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLiking, setIsLiking] = useState(false);
  const { addTaskCompletion } = useTaskCompletions();
  const [completions, setCompletions] = useState<{
    [key in Task['type']]: Array<{
      id: string;
      user: UserProfile;
      metadata?: { task_id?: string };
    }>
  }>({
    daily: [],
    achievement: [],
    story: []
  });
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    points: 10,
    type: 'daily'
  });

  useEffect(() => {
    fetchTasks();
    fetchCompletions();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('first_name');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить задания',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletions = async () => {
    try {
      const { data: completionsData, error: completionsError } = await supabase
        .from('task_completions')
        .select(`
          id,
          user_id,
          task_type,
          points_awarded,
          metadata,
          completed_at,
          user:users (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .order('completed_at', { ascending: false });

      if (completionsError) {
        console.error('Error fetching completions:', completionsError);
        showNotification({
          title: 'Ошибка',
          message: 'Не удалось загрузить отметки о выполнении',
          type: 'error'
        });
        return;
      }

      const grouped = (completionsData || []).reduce((acc: TaskCompletions, completion) => {
        if (!acc[completion.task_type]) {
          acc[completion.task_type] = [];
        }
        acc[completion.task_type].push(completion);
        return acc;
      }, {
        daily: [],
        achievement: [],
        story: []
      });

      setCompletions(grouped);
    } catch (error) {
      console.error('Error fetching completions:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Произошла ошибка при загрузке данных',
        type: 'error'
      });
    }
  };

  // Add initial special tasks
  useEffect(() => {
    const addSpecialTasks = async () => {
      const specialTasks = [
        {
          title: 'Сделать красивое фото для портала ДОиРП и SNS',
          description: 'Сделайте качественное фото для размещения на портале',
          points: 20,
          type: 'achievement'
        },
        {
          title: 'Принять участие в вечернем мероприятии',
          description: 'Активное участие в вечерней программе',
          points: 50,
          type: 'achievement'
        },
        {
          title: 'Пройти оценку ТСПП на 4,5 балла и выше',
          description: 'Получите высокую оценку по результатам ТСПП',
          points: 100,
          type: 'achievement'
        },
        {
          title: 'Получить монеты от спикера',
          description: 'За полезную активность на мероприятии. У каждого из 6 спикеров есть 20 купюр номиналом 50 баллов',
          points: 50,
          type: 'achievement'
        }
      ];

      try {
        const { error } = await supabase
          .from('tasks')
          .upsert(
            specialTasks.map(task => ({
              ...task,
              created_at: new Date().toISOString()
            })),
            { onConflict: 'title' }
          );

        if (error) throw error;
      } catch (error) {
        console.error('Error adding special tasks:', error);
      }
    };

    addSpecialTasks();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.description) {
      showNotification({
        title: 'Ошибка',
        message: 'Заполните все поля',
        type: 'error'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Задание добавлено',
        type: 'success'
      });

      setNewTask({
        title: '',
        description: '',
        points: 10,
        type: 'daily'
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось добавить задание',
        type: 'error'
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить это задание?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Задание удалено',
        type: 'success'
      });
      
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить задание',
        type: 'error'
      });
    }
  };

  const handleMarkComplete = async (task: Task) => {
    if (!selectedUsers.length) {
      showNotification({
        title: 'Ошибка',
        message: 'Выберите пользователей',
        type: 'error'
      });
      return;
    }

    try {
      // Add completion for each selected user
      for (const userId of selectedUsers) {
        await addTaskCompletion(userId, task.id, task.points);
      }

      showNotification({
        title: 'Успешно',
        message: 'Задание отмечено как выполненное',
        type: 'success'
      });

      setSelectedUsers([]);
      fetchCompletions();
    } catch (error) {
      console.error('Error marking task complete:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось отметить задание',
        type: 'error'
      });
    }
  };

  const handleRemoveCompletion = async (completionId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить отметку о выполнении?')) return;

    try {
      // Use RPC to safely remove completion and update points
      const { error } = await supabase.rpc('remove_task_completion', {
        completion_id: completionId
      });

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Отметка о выполнении удалена',
        type: 'success'
      });

      // Refresh completions
      fetchCompletions();
      
      // Add haptic feedback
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Error removing completion:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить отметку о выполнении',
        type: 'error'
      });
    }
  };

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Управление заданиями</h3>
          <p className="text-sm text-slate-400">Создание и редактирование заданий</p>
        </div>
      </div>

      {/* Add New Task Form */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Название задания"
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
        />
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Описание задания"
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 h-24"
        />
        <div className="flex gap-4">
          <input
            type="number"
            value={newTask.points}
            onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
            placeholder="Баллы"
            className="w-24 px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
          />
          <select
            value={newTask.type}
            onChange={(e) => setNewTask(prev => ({ ...prev, type: e.target.value as Task['type'] }))}
            className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
          >
            <option value="daily">Ежедневное</option>
            <option value="achievement">Достижение</option>
            <option value="story">История</option>
          </select>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddTask}
          className="w-full px-4 py-2 bg-emerald-primary/20 text-emerald-light rounded-lg hover:bg-emerald-primary/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить задание
        </motion.button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-400">Загрузка...</div>
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-light">{task.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm bg-emerald-primary/20 text-emerald-light px-2 py-1 rounded-full">
                      {task.points} баллов
                    </span>
                    <span className="text-sm bg-slate-700/50 text-slate-300 px-2 py-1 rounded-full">
                      {task.type === 'daily' ? 'Ежедневное' : 
                       task.type === 'achievement' ? 'Достижение' : 'История'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {completions[task.type]?.filter(c => c.metadata?.task_id === task.id).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Выполнили задание:</h4>
                  <div className="flex flex-wrap gap-2">
                    {completions[task.type]
                      .filter(c => c.metadata?.task_id === task.id)
                      .map((completion) => (
                        <div
                          key={completion.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/30"
                        >
                          {completion.user.photo_url ? (
                            <img
                              src={completion.user.photo_url}
                              alt={completion.user.first_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                              <span className="text-xs">{completion.user.first_name[0]}</span>
                            </div>
                          )}
                          <span className="text-sm text-slate-300">
                            {completion.user.first_name} {completion.user.last_name}
                          </span>
                          <button
                            onClick={() => handleRemoveCompletion(completion.id)}
                            className="p-1.5 rounded-full hover:bg-red-500/20 text-red-300 transition-colors"
                            title="Удалить отметку о выполнении"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Отметить выполнение</h4>
                <div className="flex flex-wrap gap-2">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUsers(prev => 
                        prev.includes(user.id) 
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      )}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user.first_name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-xs">{user.first_name[0]}</span>
                        </div>
                      )}
                      <span>{user.first_name}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleMarkComplete(task)}
                  disabled={!selectedUsers.length}
                  className="mt-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 
                             hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Отметить выполнение
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-slate-400">Нет заданий</div>
        )}
      </div>
    </div>
  );
}