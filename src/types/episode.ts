// Episode for search/autocomplete (minimal data to prevent spoilers)
export interface EpisodeSearchResult {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  hash: string; // SHA-256 hash of ID for client-side validation
}

// Daily puzzle data from API
export interface DailyPuzzle {
  puzzle_id: string; // ISO date string
  answer_hash: string; // SHA-256 hash of burger ID
  hints: {
    burger_name: string;
    burger_description: string | null;
    store_next_door: string;
    pest_control: string;
    other_burgers: string | null; // Other burgers from same episode
    plot_summary: string;
  };
  episode: {
    season: number;
    episode_number: number;
    title: string;
  };
  demo_mode?: boolean; // True when running without Supabase
}

// Global statistics for a puzzle
export interface GlobalStats {
  date: string;
  win_on_guess_1: number;
  win_on_guess_2: number;
  win_on_guess_3: number;
  win_on_guess_4: number;
  win_on_guess_5: number;
  win_on_guess_6: number;
  losses: number;
  total_plays: number;
}

// Personal statistics stored in localStorage
export interface LocalStats {
  gamesPlayed: number;
  gamesWon: number;
  winPercentage: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
    6: number;
  };
  lastPlayedDate: string | null;
  lastGameStatus: 'WON' | 'LOST' | 'IN_PROGRESS' | null;
}

// Game state for current session
export interface GameState {
  puzzleId: string;
  guesses: GuessAttempt[];
  status: 'IN_PROGRESS' | 'WON' | 'LOST';
  revealedHints: number; // 1-5, how many hints are visible
  answerHash: string;
}

// A single guess attempt
export interface GuessAttempt {
  episode: EpisodeSearchResult;
  isCorrect: boolean;
  timestamp: number;
}

// Hint types for progressive reveal (updated order)
export type HintType =
  | 'burger_name'
  | 'store_next_door'
  | 'pest_control'
  | 'other_burgers'
  | 'plot_summary';

export const HINT_ORDER: HintType[] = [
  'store_next_door',   // Store pun (Hint #1)
  'pest_control',      // Van parody
  'other_burgers',     // Other burgers from episode (nullable)
  'plot_summary',      // Episode description (easiest)
];

export const HINT_LABELS: Record<HintType, string> = {
  burger_name: '🍔 Burger of the Day',
  store_next_door: '🏪 Store Next Door',
  pest_control: '🚐 Pest Control Truck',
  other_burgers: '🍔 Other Burgers',
  plot_summary: '📺 Plot Summary',
};

// Maximum guesses allowed
export const MAX_GUESSES = 6;
