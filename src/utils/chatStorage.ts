import { Message } from '../types/chat';

const CHAT_STORAGE_KEY = 'chat_messages';
const MAX_MESSAGES = 50;

export function getLocalMessages(): Message[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local messages:', error);
    return [];
  }
}

export function saveLocalMessages(messages: Message[]) {
  try {
    // Keep only the latest messages
    const messagesToStore = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messagesToStore));
  } catch (error) {
    console.error('Error saving local messages:', error);
  }
}

export function clearLocalMessages() {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing local messages:', error);
  }
}