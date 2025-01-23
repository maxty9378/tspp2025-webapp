import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Save, X, Clock, MapPin, User, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { showNotification } from '../../utils/notifications';
import { hapticFeedback } from '../../utils/telegram';
import { Program } from '../../hooks/usePrograms';

interface Speaker {
  id: string;
  first_name: string;
  last_name?: string;
  position?: string;
  photo_url?: string;
}

interface ProgramForm {
  title: string;
  description: string;
  day_index: number;
  time_start: string;
  time_end: string;
  location: string;
  speakers: Array<{
    id: string;
    role: 'primary' | 'secondary' | 'tertiary';
  }>;
}

const INITIAL_FORM: ProgramForm = {
  title: '',
  description: '',
  day_index: 0,
  time_start: '09:00',
  time_end: '10:00',
  location: '',
  speakers: []
};

export function ProgramManagement() {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(INITIAL_FORM);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({
    first_name: '',
    last_name: '',
    position: ''
  });

  useEffect(() => {
    fetchPrograms();
    fetchSpeakers();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          speakers:program_speakers(
            role,
            speaker:users(
              id,
              first_name,
              last_name,
              position,
              photo_url
            )
          )
        `)
        .order('day_index')
        .order('time_start');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSpeakers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'speaker')
        .order('first_name');

      if (error) throw error;
      setSpeakers(data || []);
    } catch (error) {
      console.error('Error fetching speakers:', error);
    }
  };

  const handleAddSpeaker = async () => {
    try {
      setIsLoading(true);
      
      // Create new speaker profile
      const { data: speaker, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          first_name: newSpeaker.first_name,
          last_name: newSpeaker.last_name,
          position: newSpeaker.position,
          role: 'speaker'
        })
        .select()
        .single();

      if (error) throw error;

      // Add to speakers list
      setSpeakers(prev => [...prev, speaker]);
      setShowSpeakerForm(false);
      setNewSpeaker({ first_name: '', last_name: '', position: '' });

      hapticFeedback('success');
      showNotification({
        title: 'Спикер добавлен',
        message: 'Новый спикер успешно создан',
        type: 'success'
      });
    } catch (error) {
      console.error('Error adding speaker:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось добавить спикера',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProgram = (program: Program) => {
    setIsEditing(program.id);
    setForm({
      title: program.title,
      description: program.description || '',
      day_index: program.day_index,
      time_start: program.time_start,
      time_end: program.time_end,
      location: program.location || '',
      speakers: program.speakers.map(s => ({
        id: s.speaker.id,
        role: s.role
      }))
    });
  };

  const handleDeleteProgram = async (programId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить это мероприятие?')) return;

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);

      if (error) throw error;

      hapticFeedback('success');
      showNotification({
        title: 'Успешно',
        message: 'Мероприятие удалено',
        type: 'success'
      });

      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось удалить мероприятие',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validate form
      if (!form.title || !form.time_start || !form.time_end) {
        showNotification({
          title: 'Ошибка',
          message: 'Заполните обязательные поля',
          type: 'error'
        });
        return;
      }

      if (isEditing) {
        // Update existing program
        const { error: programError } = await supabase
          .from('programs')
          .update({
            title: form.title,
            description: form.description,
            day_index: form.day_index,
            time_start: form.time_start,
            time_end: form.time_end,
            location: form.location
          })
          .eq('id', isEditing);

        if (programError) throw programError;

        // Update speakers
        await supabase
          .from('program_speakers')
          .delete()
          .eq('program_id', isEditing);

        if (form.speakers.length > 0) {
          const { error: speakersError } = await supabase
            .from('program_speakers')
            .insert(
              form.speakers.map(speaker => ({
                program_id: isEditing,
                speaker_id: speaker.id,
                role: speaker.role
              }))
            );

          if (speakersError) throw speakersError;
        }

        hapticFeedback('success');
        showNotification({
          title: 'Успешно',
          message: 'Мероприятие обновлено',
          type: 'success'
        });
      } else {
        // Create new program
        const { data: program, error: programError } = await supabase
          .from('programs')
          .insert({
            title: form.title,
            description: form.description,
            day_index: form.day_index,
            time_start: form.time_start,
            time_end: form.time_end,
            location: form.location
          })
          .select()
          .single();

        if (programError) throw programError;

        // Add speakers
        if (form.speakers.length > 0) {
          const { error: speakersError } = await supabase
            .from('program_speakers')
            .insert(
              form.speakers.map(speaker => ({
                program_id: program.id,
                speaker_id: speaker.id,
                role: speaker.role
              }))
            );

          if (speakersError) throw speakersError;
        }

        hapticFeedback('success');
        showNotification({
          title: 'Успешно',
          message: 'Мероприятие добавлено в программу',
          type: 'success'
        });
      }

      setForm(INITIAL_FORM);
      setIsAdding(false);
      setIsEditing(null);
      fetchPrograms();
    } catch (error) {
      console.error('Error saving program:', error);
      hapticFeedback('error');
      showNotification({
        title: 'Ошибка',
        message: 'Не удалось сохранить мероприятие',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Управление программой</h3>
          <p className="text-sm text-slate-400">Добавление и редактирование мероприятий</p>
        </div>
      </div>

      {!isAdding && !isEditing ? (
        <div className="space-y-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsAdding(true);
              fetchSpeakers();
            }}
            className="w-full px-4 py-2 bg-emerald-primary/20 text-emerald-light rounded-lg hover:bg-emerald-primary/30 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить мероприятие
          </motion.button>

          {/* Programs List */}
          <div className="space-y-3">
            {programs.map((program) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-light font-medium px-3 py-1 bg-emerald-primary/20 rounded-full text-sm">
                      {`${program.time_start.slice(0, 5)} - ${program.time_end.slice(0, 5)}`}
                    </span>
                    <span className="text-sm text-slate-400">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт'][program.day_index]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProgram(program)}
                      className="p-2 rounded-lg hover:bg-slate-700/50"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteProgram(program.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <h4 className="text-lg font-medium text-slate-200 mb-2">
                  {program.title}
                </h4>

                {program.description && (
                  <p className="text-sm text-slate-400 mb-2">
                    {program.description}
                  </p>
                )}

                {program.location && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{program.location}</span>
                  </div>
                )}

                {program.speakers?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-700/30">
                    {program.speakers.map((speaker) => (
                      <div
                        key={speaker.speaker.id}
                        className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                      >
                        {speaker.speaker.photo_url ? (
                          <img
                            src={speaker.speaker.photo_url}
                            alt={speaker.speaker.first_name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-slate-200">
                            {speaker.speaker.first_name} {speaker.speaker.last_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {speaker.speaker.position}
                          </div>
                        </div>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          speaker.role === 'primary' ? 'bg-emerald-500/20 text-emerald-300' :
                          speaker.role === 'secondary' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {speaker.role === 'primary' ? 'Основной' :
                           speaker.role === 'secondary' ? 'Со-спикер' : 
                           'Участник'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Название мероприятия"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Описание мероприятия"
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 h-24 resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">День</label>
                <select
                  value={form.day_index}
                  onChange={(e) => setForm(prev => ({ ...prev, day_index: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                >
                  <option value={0}>Понедельник</option>
                  <option value={1}>Вторник</option>
                  <option value={2}>Среда</option>
                  <option value={3}>Четверг</option>
                  <option value={4}>Пятница</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Локация</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Место проведения"
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Начало</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={form.time_start}
                    onChange={(e) => setForm(prev => ({ ...prev, time_start: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Окончание</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={form.time_end}
                    onChange={(e) => setForm(prev => ({ ...prev, time_end: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-400">Спикеры</label>
                <button
                  onClick={() => setShowSpeakerForm(true)}
                  className="text-sm text-emerald-light hover:text-emerald-light/80"
                >
                  Добавить спикера
                </button>
              </div>

              <div className="space-y-2">
                {form.speakers.map((speaker, index) => {
                  const speakerData = speakers.find(s => s.id === speaker.id);
                  if (!speakerData) return null;

                  return (
                    <div
                      key={speaker.id}
                      className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-slate-200">
                          {speakerData.first_name} {speakerData.last_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {speakerData.position}
                        </div>
                      </div>
                      <select
                        value={speaker.role}
                        onChange={(e) => {
                          const newSpeakers = [...form.speakers];
                          newSpeakers[index].role = e.target.value as 'primary' | 'secondary' | 'tertiary';
                          setForm(prev => ({ ...prev, speakers: newSpeakers }));
                        }}
                        className="px-2 py-1 bg-slate-800 rounded-lg text-sm text-slate-200 border border-slate-700"
                      >
                        <option value="primary">Основной</option>
                        <option value="secondary">Со-спикер</option>
                        <option value="tertiary">Участник</option>
                      </select>
                      <button
                        onClick={() => {
                          const newSpeakers = form.speakers.filter((_, i) => i !== index);
                          setForm(prev => ({ ...prev, speakers: newSpeakers }));
                        }}
                        className="p-1 hover:bg-red-500/20 rounded-lg group"
                      >
                        <X className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  );
                })}

                {speakers.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setForm(prev => ({
                        ...prev,
                        speakers: [
                          ...prev.speakers,
                          { id: e.target.value, role: 'primary' }
                        ]
                      }));
                    }}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                  >
                    <option value="">Выберите спикера</option>
                    {speakers
                      .filter(s => !form.speakers.some(selected => selected.id === s.id))
                      .map(speaker => (
                        <option key={speaker.id} value={speaker.id}>
                          {speaker.first_name} {speaker.last_name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsAdding(false);
                setIsEditing(null);
                setForm(INITIAL_FORM);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-emerald-primary/20 text-emerald-light hover:bg-emerald-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </motion.div>
      )}

      {/* New Speaker Form Modal */}
      <AnimatePresence>
        {showSpeakerForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowSpeakerForm(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative w-full max-w-md bg-slate-900/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-700/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-emerald-light">
                      Новый спикер
                    </h3>
                    <p className="text-sm text-slate-400">
                      Добавить нового спикера
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSpeakerForm(false)}
                  className="p-2 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newSpeaker.first_name}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Имя"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                />

                <input
                  type="text"
                  value={newSpeaker.last_name}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Фамилия"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                />

                <input
                  type="text"
                  value={newSpeaker.position}
                  onChange={(e) => setNewSpeaker(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Должность"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200"
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowSpeakerForm(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAddSpeaker}
                    disabled={isLoading || !newSpeaker.first_name || !newSpeaker.position}
                    className="px-4 py-2 rounded-lg bg-emerald-primary/20 text-emerald-light hover:bg-emerald-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Save className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}