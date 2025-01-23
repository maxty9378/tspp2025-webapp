import { UserProfile } from '../types';

class MockStorage {
  private storage: Map<string, UserProfile>;

  constructor() {
    this.storage = new Map();
  }

  get(id: string): UserProfile | undefined {
    return this.storage.get(id);
  }

  set(id: string, data: UserProfile): void {
    this.storage.set(id, data);
  }

  values(): UserProfile[] {
    return Array.from(this.storage.values());
  }

  clear(): void {
    this.storage.clear();
  }

  delete(id: string): boolean {
    return this.storage.delete(id);
  }

  has(id: string): boolean {
    return this.storage.has(id);
  }
}

export const mockStorage = new MockStorage();