import { TelegramUser, UserProfile } from '../types';

const API_BASE_URL = '/api';

export async function fetchUser(userId: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function createUser(user: TelegramUser): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: user.id.toString(),
        username: user.username || '',
        firstName: user.first_name,
        lastName: user.last_name || '',
        photoUrl: user.photo_url || '',
        points: 10,
        visitCount: 1,
        lastVisit: new Date(),
        lastActive: new Date(),
        isAdmin: Boolean(user.is_admin),
        role: 'participant',
        streak: 1
      }),
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function updateUser(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function fetchUsers(): Promise<UserProfile[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}