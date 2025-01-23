import { faker } from '@faker-js/faker/locale/ru';
import { supabase } from '../lib/supabase';
import { showNotification } from './notifications';

export async function generateTestUsers(count: number = 40) {
  try {
    const users = Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      username: faker.internet.userName().toLowerCase(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      photo_url: faker.image.avatar(),
      points: faker.number.int({ min: 0, max: 500 }),
      visit_count: faker.number.int({ min: 1, max: 20 }),
      last_visit: faker.date.recent({ days: 7 }).toISOString(),
      last_active: faker.date.recent({ days: 1 }).toISOString(),
      is_admin: false,
      role: faker.helpers.arrayElement(['participant', 'participant', 'participant', 'organizer']),
      streak: faker.number.int({ min: 0, max: 7 }),
      created_at: faker.date.past({ days: 30 }).toISOString(),
      updated_at: faker.date.recent().toISOString(),
      liked_by: [],
      likes: [],
      total_coins_earned: faker.number.int({ min: 0, max: 10000 })
    }));

    const { error } = await supabase
      .from('users')
      .insert(users);

    if (error) throw error;

    showNotification({
      title: 'Тестовые пользователи созданы',
      message: `Добавлено ${count} пользователей`,
      type: 'success'
    });

    return users;
  } catch (error) {
    console.error('Error generating test users:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось создать тестовых пользователей',
      type: 'error'
    });
    return null;
  }
}

export async function simulateUserActivity() {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, points')
      .not('username', 'eq', '@kadochkindesign');

    if (!users) return;

    const updates = users.map(user => ({
      id: user.id,
      points: user.points + faker.number.int({ min: 5, max: 50 }),
      last_active: faker.date.recent({ days: 1 }).toISOString(),
      visit_count: faker.number.int({ min: 1, max: 5 })
    }));

    for (const update of updates) {
      await supabase
        .from('users')
        .update(update)
        .eq('id', update.id);
    }

    showNotification({
      title: 'Активность симулирована',
      message: `Обновлено ${updates.length} пользователей`,
      type: 'success'
    });
  } catch (error) {
    console.error('Error simulating activity:', error);
    showNotification({
      title: 'Ошибка',
      message: 'Не удалось симулировать активность',
      type: 'error'
    });
  }
}