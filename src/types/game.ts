export interface Team {
  id: string;
  name: string;
  members: string[];
  score: number;
  level: number;
}

export interface MazeGame {
  id: string;
  active: boolean;
  teams: Team[];
  started_at: string;
  teams_locked?: boolean;
  ended_at?: string;
}

export interface GameState {
  isActive: boolean;
  currentGame?: MazeGame;
}