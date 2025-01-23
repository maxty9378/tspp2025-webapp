import axios from 'axios';
import { supabase } from './supabase';
import { showNotification } from '../utils/notifications';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
export const GROUP_CHAT_ID = import.meta.env.VITE_TELEGRAM_GROUP_CHAT_ID;
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessageToGroup(text: string, userId: string | null = null) {
  try {
    if (!BOT_TOKEN || !GROUP_CHAT_ID) {
      console.error('Missing bot token or group chat ID');
      return null;
    }

    // Get user info if userId provided
    let userInfo = null;
    if (userId) {
      const { data: user } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();
      userInfo = user;
    }

    // Format message with user info
    const formattedText = userInfo 
      ? `${text}\n\nОт: ${userInfo.first_name} ${userInfo.last_name || ''}`
      : text;

    // Send to Telegram
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: GROUP_CHAT_ID,
      text: formattedText,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    if (!response.data.ok) {
      throw new Error('Failed to send message to Telegram');
    }

    // Save message to database
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        text,
        user_id: userId || 'system',
        type: 'text',
        telegram_message_id: response.data.result.message_id,
        is_from_telegram: false,
        sender_name: userInfo ? `${userInfo.first_name} ${userInfo.last_name || ''}` : 'System',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return response.data.result;

  } catch (error) {
    console.error('Error sending message:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось отправить сообщение',
      type: 'error'
    });
    return null;
  }
}

export function openTelegramChat() {
  const chatId = GROUP_CHAT_ID.replace(/^-+/, '');
  const url = `https://t.me/c/${chatId}`;

  const tg = window.Telegram?.WebApp;
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}