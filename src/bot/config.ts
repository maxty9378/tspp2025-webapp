import { Telegraf } from 'telegraf';
import { config } from '../lib/config';

// Initialize bot with token
const bot = new Telegraf(config.VITE_TELEGRAM_BOT_TOKEN);

// Configure inline keyboard button
bot.command(['start', 'help'], async (ctx) => {
  try {
    await ctx.reply('Добро пожаловать в ТСПП2025! 👋', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть приложение',
              web_app: { url: 'https://aacvkrslnwmuomemtuca.supabase.co' }
            }
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
});

// Handle errors
bot.catch((err) => {
  console.error('Bot error:', err);
});

export { bot };