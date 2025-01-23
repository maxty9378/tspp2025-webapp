import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';

interface AOSProgram {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  created_at: string;
}

export function AOSManagement() {
  const [programs, setPrograms] = useState<AOSProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [showResponses, setShowResponses] = useState(false);
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    enabled: true
  });

  useEffect(() => {
    fetchPrograms();
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('aos_responses')
        .select(`
          id,
          program_id,
          ratings,
          feedback,
          created_at,
          user:users (
            id,
            first_name,
            last_name,
            photo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group responses by program
      const grouped = (data || []).reduce((acc, response) => {
        if (!acc[response.program_id]) {
          acc[response.program_id] = [];
        }
        acc[response.program_id].push(response);
        return acc;
      }, {} as Record<string, any[]>);

      setResponses(grouped);
    } catch (error) {
      console.error('Error fetching AOS responses:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить ответы АОС',
        type: 'error'
      });
    }
  };
  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('type', 'aos')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching AOS programs:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось загрузить программы АОС',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = async () => {
    if (!newProgram.title) {
      showNotification({
        title: 'Ошибка',
        message: 'Введите название программы',
        type: 'error'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...newProgram,
          type: 'aos',
          points: 30,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Программа АОС добавлена',
        type: 'success'
      });

      setNewProgram({
        title: '',
        description: '',
        enabled: true
      });
      
      fetchPrograms();
    } catch (error) {
      console.error('Error adding AOS program:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось добавить программу',
        type: 'error'
      });
    }
  };

  const handleToggleProgram = async (programId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ enabled })
        .eq('id', programId);

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: enabled ? 'АОС активирована' : 'АОС деактивирована',
        type: 'success'
      });
      
      fetchPrograms();
    } catch (error) {
      console.error('Error toggling AOS program:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось обновить статус программы',
        type: 'error'
      });
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту программу АОС?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      showNotification({
        title: 'Успешно',
        message: 'Программа АОС удалена',
        type: 'success'
      });
      
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting AOS program:', error);
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить программу',
        type: 'error'
      });
    }
  };

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Управление АОС</h3>
          <p className="text-sm text-slate-400">Создание и редактирование анкет обратной связи</p>
        </div>
      </div>

      {/* Add New Program Form */}
      <div className="space-y-4 mb-6">
        <input
          type="text"
          value={newProgram.title}
          onChange={(e) => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Название программы"
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
        />
        <textarea
          value={newProgram.description}
          onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Описание программы"
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 h-24"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAddProgram}
          className="w-full px-4 py-2 bg-emerald-primary/20 text-emerald-light rounded-lg hover:bg-emerald-primary/30 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить программу
        </motion.button>
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center text-slate-400">Загрузка...</div>
        ) : programs.length > 0 ? (
          programs.map(program => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-medium text-emerald-light">{program.title}</h4>
                  {responses[program.id]?.length > 0 && (
                    <p className="text-sm text-slate-400 mt-1">
                      Получено ответов: {responses[program.id].length}
                    </p>
                  )}
                  {program.description && (
                    <p className="text-sm text-slate-400 mt-1">{program.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm bg-emerald-primary/20 text-emerald-light px-2 py-1 rounded-full">
                      30 баллов
                    </span>
                    {responses[program.id]?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowResponses(prev => !prev);
                        }}
                        className="text-sm bg-slate-800/50 text-slate-300 px-2 py-1 rounded-full hover:bg-slate-800"
                      >
                        Просмотреть ответы
                      </button>
                    )}
                  </div>
                  {showResponses && responses[program.id]?.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {responses[program.id].map((response) => (
                        <div key={response.id} className="p-4 bg-slate-800/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {response.user.photo_url ? (
                              <img
                                src={response.user.photo_url}
                                alt={response.user.first_name}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                                <span className="text-xs">{response.user.first_name[0]}</span>
                              </div>
                            )}
                            <span className="text-sm text-slate-300">
                              {response.user.first_name} {response.user.last_name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(response.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-sm font-medium text-slate-300">Оценки:</h5>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                {Object.entries(response.ratings).map(([key, value]) => (
                                  <div key={key} className="text-xs text-slate-400">
                                    {key}: {value}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-slate-300">Отзывы:</h5>
                              <div className="space-y-2 mt-1">
                                {Object.entries(response.feedback).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="text-slate-400">{key}:</span>
                                    <p className="text-slate-300 mt-1">{value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleProgram(program.id, !program.enabled)}
                    className={`p-2 rounded-lg transition-colors ${
                      program.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {program.enabled ? 'Активно' : 'Неактивно'}
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(program.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center text-slate-400">Нет программ АОС</div>
        )}
      </div>
    </div>
  );
}