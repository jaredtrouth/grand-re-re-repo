import { LocalStats } from '@/types/episode';

const STATS_KEY = 'burger-daydle-stats';
const GAME_STATE_KEY = 'burger-daydle-game';

// Default stats for new users
const DEFAULT_STATS: LocalStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    winPercentage: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
    },
    lastPlayedDate: null,
    lastGameStatus: null,
};

// Get stats from localStorage
export function getLocalStats(): LocalStats {
    if (typeof window === 'undefined') return DEFAULT_STATS;

    try {
        const stored = localStorage.getItem(STATS_KEY);
        if (!stored) return DEFAULT_STATS;
        return JSON.parse(stored) as LocalStats;
    } catch {
        return DEFAULT_STATS;
    }
}

// Save stats to localStorage
export function saveLocalStats(stats: LocalStats): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {
        console.error('Failed to save stats:', e);
    }
}

// Update stats after a game ends
export function updateStatsAfterGame(
    won: boolean,
    guessCount: number,
    puzzleDate: string
): LocalStats {
    const stats = getLocalStats();

    // Check if this is a new day (reset streak if missed a day)
    const today = puzzleDate;
    const lastPlayed = stats.lastPlayedDate;

    // Don't double-count if already played today
    if (lastPlayed === today && stats.lastGameStatus !== 'IN_PROGRESS') {
        return stats;
    }

    // Update games played
    stats.gamesPlayed += 1;
    stats.lastPlayedDate = today;

    if (won) {
        stats.gamesWon += 1;
        stats.lastGameStatus = 'WON';

        // Update guess distribution
        const guessKey = guessCount as 1 | 2 | 3 | 4 | 5 | 6;
        stats.guessDistribution[guessKey] += 1;

        // Update streak
        if (isConsecutiveDay(lastPlayed, today)) {
            stats.currentStreak += 1;
        } else {
            stats.currentStreak = 1;
        }
        stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    } else {
        stats.lastGameStatus = 'LOST';
        stats.currentStreak = 0;
    }

    // Recalculate win percentage
    stats.winPercentage = Math.round((stats.gamesWon / stats.gamesPlayed) * 100);

    saveLocalStats(stats);
    return stats;
}

// Check if two dates are consecutive (for streak tracking)
function isConsecutiveDay(lastDate: string | null, currentDate: string): boolean {
    if (!lastDate) return false;

    const last = new Date(lastDate);
    const current = new Date(currentDate);
    const diffTime = current.getTime() - last.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 1;
}

// Mark game as in progress for today
export function markGameInProgress(puzzleDate: string): void {
    const stats = getLocalStats();

    if (stats.lastPlayedDate !== puzzleDate) {
        stats.lastPlayedDate = puzzleDate;
        stats.lastGameStatus = 'IN_PROGRESS';
        saveLocalStats(stats);
    }
}

// Get saved game state for the current puzzle
export function getSavedGameState(puzzleId: string): string | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem(GAME_STATE_KEY);
        if (!stored) return null;

        // Validate that the stored state is for today's puzzle
        const parsed = JSON.parse(stored);
        if (parsed.puzzleId !== puzzleId) {
            // Old puzzle state, return null to start fresh
            return null;
        }
        return stored;
    } catch {
        return null;
    }
}

// Save game state (overwrites previous puzzle's state)
export function saveGameState(puzzleId: string, state: object): void {
    if (typeof window === 'undefined') return;

    try {
        // Include puzzleId in the state for validation on load
        const stateWithId = { ...state, puzzleId };
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(stateWithId));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

// Generate share text for completed game
export function generateShareText(
    puzzleDate: string,
    won: boolean,
    guessCount: number,
    maxGuesses: number
): string {
    const result = won ? `${guessCount}/${maxGuesses}` : `X/${maxGuesses}`;
    const emojis = generateEmojiGrid(guessCount, won, maxGuesses);

    return `🍔 Burger of the Daydle ${puzzleDate}\n${result}\n\n${emojis}\n\nPlay at: burgeroftheday.dle`;
}

// Generate emoji grid for share
function generateEmojiGrid(guessCount: number, won: boolean, maxGuesses: number): string {
    const rows: string[] = [];

    for (let i = 1; i <= (won ? guessCount : maxGuesses); i++) {
        if (i === guessCount && won) {
            rows.push('🟩🟩🟩🟩🟩'); // Winning row
        } else {
            rows.push('🟥🟥🟥🟥🟥'); // Wrong guess
        }
    }

    return rows.join('\n');
}
