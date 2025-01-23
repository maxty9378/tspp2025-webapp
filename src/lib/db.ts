import { supabase, withConnection } from './supabase';
import { TelegramUser, UserProfile } from '../types';
import { mockStorage } from './mockDb';
import { showNotification } from '../utils/notifications';
import { DailyTask } from '../data/dailyTasks';

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  type: 'text' | 'image' | 'task';
  imageUrl?: string;
  taskId?: number;
  createdAt: string;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: number;
  completedAt: string;
  proofMessageId?: string;
  pointsAwarded: number;
}

export async function fetchUser(userId: string): Promise<UserProfile | null> {
  return withConnection(async () => {
    try {
      if (!supabase) {
        return mockStorage.get(userId) || null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error fetching user:', error);
      return null;
    }
  });
}

export async function createUser(user: TelegramUser): Promise<UserProfile | null> {
  return withConnection(async () => {
    if (!user?.id) {
      console.error('Invalid user data: missing id');
      return null;
    }

    try {
      if (!supabase) {
        const newUser: UserProfile = {
          id: user.id?.toString() || '',
          username: user.username || '',
          first_name: user.first_name,
          last_name: user.last_name || '',
          photo_url: user.photo_url || '',
          points: 10,
          visit_count: 1,
          last_visit: new Date().toISOString(),
          last_active: new Date().toISOString(),
          is_admin: Boolean(user.is_admin),
          role: 'participant',
          streak: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          liked_by: [],
          likes: [],
          total_coins_earned: 0,
          daily_likes_given: 0
        };
        mockStorage.set(user.id.toString(), newUser);
        return newUser;
      }

      const now = new Date().toISOString();
      const newUser = {
        id: user.id.toString(),
        username: user.username || '',
        first_name: user.first_name,
        last_name: user.last_name || '',
        photo_url: user.photo_url || '',
        points: 10,
        visit_count: 1,
        last_visit: now,
        last_active: now,
        is_admin: Boolean(user.is_admin),
        role: 'participant',
        streak: 1,
        created_at: now,
        updated_at: now,
        liked_by: [],
        likes: [],
        total_coins_earned: 0,
        daily_likes_given: 0
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        console.error('Error creating user:', error.message);
        return null;
      }

      // Show celebration animation
      const tg = window.Telegram?.WebApp;
      if (tg?.showPopup) {
        await tg.showPopup({
          title: '🎉 Профиль создан!',
          message: 'Добро пожаловать в ТСПП2025!\n\n+10 баллов за регистрацию',
          buttons: [
            { type: 'ok', text: '🚀 Поехали!' }
          ]
        });
      }

      // Add haptic feedback
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
        tg.HapticFeedback.impactOccurred('heavy');
      }

      return data;
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      return null;
    }
  });
}

export async function updateUser(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  return withConnection(async () => {
    if (!userId) {
      console.error('Invalid userId provided');
      return null;
    }

    try {
      if (!supabase) {
        const existingUser = mockStorage.get(userId);
        if (!existingUser) return null;
        
        const updatedUser = {
          ...existingUser,
          ...updates,
          updated_at: new Date().toISOString()
        };
        mockStorage.set(userId, updatedUser);
        return updatedUser;
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('*')
        .single();
      
      if (error) {
        console.error('Error updating user:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error updating user:', error);
      return null;
    }
  });
}

export async function fetchUsers(): Promise<UserProfile[]> {
  return withConnection(async () => {
    try {
      if (!supabase) {
        return Array.from(mockStorage.values()).sort((a, b) => b.points - a.points);
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('points', { ascending: false });
      
      if (error) {
        console.error('Error fetching users:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error fetching users:', error);
      return [];
    }
  });
}

export async function sendMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage | null> {
  return withConnection(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          user_id: message.userId,
          text: message.text,
          type: message.type,
          image_url: message.imageUrl,
          task_id: message.taskId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  });
}

export async function fetchMessages(limit = 50): Promise<ChatMessage[]> {
  return withConnection(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  });
}

export async function completeTask(userId: string, taskId: number, proofMessageId?: string): Promise<TaskCompletion | null> {
  return withConnection(async () => {
    try {
      // Get task details
      const { data: task } = await supabase
        .from('tasks')
        .select('points')
        .eq('id', taskId)
        .single();

      if (!task) throw new Error('Task not found');

      // Record completion
      const { data, error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: userId,
          task_id: taskId,
          proof_message_id: proofMessageId,
          points_awarded: task.points
        }])
        .select()
        .single();

      if (error) throw error;

      // Update user points
      await supabase
        .from('users')
        .update({ 
          points: supabase.sql`points + ${task.points}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      return data;
    } catch (error) {
      console.error('Error completing task:', error);
      return null;
    }
  });
}