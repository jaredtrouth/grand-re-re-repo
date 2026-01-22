export interface EpisodeSearchResult {
  id: string;
  season: number;
  episode_number: number;
  title: string;
  synopsis?: string;
  hash: string; // SHA-256 hash of ID for client-side validation
}


export interface EpisodeQuote {
  text: string;
  speaker: string | null; // null until revealed
}

export interface DailyPuzzle {
  puzzle_id: string; // ISO date string
  answer_hash: string; // SHA-256 hash of episode ID

  burger: {
    name: string;
    description?: string | null;
  };

  quote: EpisodeQuote | null;

  still_url: string | null;

  hints: {
    store_next_door: string | null;
    pest_control: string | null;
    original_air_date: string | null;
    guest_stars: string | null;
  };

  episode: {
    season: number;
    episode_number: number;
    title: string;
  };
}

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

export type RevealStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface GameState {
  puzzleId: string;
  guesses: GuessAttempt[];
  status: 'IN_PROGRESS' | 'WON' | 'LOST';
  revealStep: RevealStep;
  answerHash: string;
}

export interface GuessAttempt {
  episode: EpisodeSearchResult;
  isCorrect: boolean;
  timestamp: number;
}

export const REVEAL_STATES: Record<RevealStep, {
  quoteAttributionVisible: boolean;
  stillVisible: boolean;
  stillBlurred: boolean;
  storeVisible: boolean;
  pestControlVisible: boolean;
  seasonVisible: boolean;
}> = {
  0: { quoteAttributionVisible: false, stillVisible: false, stillBlurred: true, storeVisible: false, pestControlVisible: false, seasonVisible: false },
  1: { quoteAttributionVisible: true, stillVisible: false, stillBlurred: true, storeVisible: false, pestControlVisible: false, seasonVisible: false },
  2: { quoteAttributionVisible: true, stillVisible: true, stillBlurred: true, storeVisible: false, pestControlVisible: false, seasonVisible: false },
  3: { quoteAttributionVisible: true, stillVisible: true, stillBlurred: true, storeVisible: true, pestControlVisible: false, seasonVisible: false },
  4: { quoteAttributionVisible: true, stillVisible: true, stillBlurred: true, storeVisible: true, pestControlVisible: true, seasonVisible: false },
  5: { quoteAttributionVisible: true, stillVisible: true, stillBlurred: false, storeVisible: true, pestControlVisible: true, seasonVisible: true },
  6: { quoteAttributionVisible: true, stillVisible: true, stillBlurred: false, storeVisible: true, pestControlVisible: true, seasonVisible: true },
};

// Maximum guesses allowed
export const MAX_GUESSES = 6;

