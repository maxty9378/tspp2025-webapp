import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadStory } from '../../utils/stories';
import { showNotification } from '../../utils/notifications';

const STORY_TYPES = [
  { value: '#ЯиСпикер', label: 'Фото со спикером' },
  { value: '#МояКоманда', label: 'Командное фото' },
  { value: '#МойУспех', label: 'История успеха' }
];

export function AdminStoriesUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return;

    const isAdmin = Boolean(
      localStorage.getItem('admin_auth') === 'true' && 
      localStorage.getItem('adminUsername') === '@kadochkindesign'
    );

    if (!isAdmin) {
      showNotification({
        title: 'Ошибка',
        message: 'Недостаточно прав для загрузки историй',
        type: 'error'
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadStory(selectedFile, selectedType, 'system');
      
      // Reset form
      setSelectedFile(null);
      setSelectedType('');
      setPreview(null);
      
      showNotification({
        title: 'Успешно',
        message: 'История добавлена',
        type: 'success'
      });
    } catch (error) {
      console.error('Error uploading story:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
          <Camera className="w-5 h-5 text-emerald-primary" />
        </div>
        <div>
          <h3 className="font-medium text-emerald-light">Загрузка историй</h3>
          <p className="text-sm text-slate-400">Добавить рекламный контент</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div className="relative">
          {preview ? (
            <div className="relative">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <label className="block w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-emerald-primary/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Upload className="w-8 h-8 mb-2" />
                <span>Выберите фото для загрузки</span>
              </div>
            </label>
          )}
        </div>

        {/* Story Type Selection */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/30 rounded-lg text-slate-200 focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="">Выберите тип истории</option>
          {STORY_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        {/* Upload Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleUpload}
          disabled={!selectedFile || !selectedType || isUploading}
          className="w-full px-4 py-2 bg-emerald-primary/20 text-emerald-light rounded-lg hover:bg-emerald-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Upload className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
          {isUploading ? 'Загрузка...' : 'Загрузить историю'}
        </motion.button>
      </div>
    </div>
  );
}