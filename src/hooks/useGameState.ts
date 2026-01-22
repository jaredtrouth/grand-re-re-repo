'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    GameState,
    DailyPuzzle,
    EpisodeSearchResult,
    GuessAttempt,
    MAX_GUESSES,
    RevealStep,
    REVEAL_STATES
} from '@/types/episode';
import { validateGuess } from '@/lib/hash';
import {
    getSavedGameState,
    saveGameState,
    updateStatsAfterGame,
    markGameInProgress
} from '@/lib/localStorage';

interface UseGameStateReturn {
    puzzle: DailyPuzzle | null;
    gameState: GameState | null;
    isLoading: boolean;
    error: string | null;
    makeGuess: (episode: EpisodeSearchResult) => Promise<void>;
    revealState: typeof REVEAL_STATES[RevealStep];
}

export function useGameState(): UseGameStateReturn {
    const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch today's puzzle on mount
    useEffect(() => {
        async function fetchPuzzle() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/daily');

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to fetch puzzle');
                }

                const puzzleData: DailyPuzzle = await response.json();
                setPuzzle(puzzleData);

                // Try to restore saved game state
                const savedState = getSavedGameState(puzzleData.puzzle_id);

                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setGameState(parsed as GameState);
                } else {
                    // Initialize new game at Step 0
                    const newState: GameState = {
                        puzzleId: puzzleData.puzzle_id,
                        guesses: [],
                        status: 'IN_PROGRESS',
                        revealStep: 0,
                        answerHash: puzzleData.answer_hash,
                    };
                    setGameState(newState);
                    markGameInProgress(puzzleData.puzzle_id);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Unknown error');
            } finally {
                setIsLoading(false);
            }
        }

        fetchPuzzle();
    }, []);

    // Save game state whenever it changes
    useEffect(() => {
        if (gameState && puzzle) {
            saveGameState(puzzle.puzzle_id, gameState);
        }
    }, [gameState, puzzle]);

    // Make a guess
    const makeGuess = useCallback(async (episode: EpisodeSearchResult) => {
        if (!puzzle || !gameState || gameState.status !== 'IN_PROGRESS') {
            return;
        }

        // Check if already guessed this episode
        if (gameState.guesses.some(g => g.episode.id === episode.id)) {
            return;
        }

        // Validate the guess
        const isCorrect = await validateGuess(episode.id, gameState.answerHash);

        const newGuess: GuessAttempt = {
            episode,
            isCorrect,
            timestamp: Date.now(),
        };

        const newGuesses = [...gameState.guesses, newGuess];
        const guessCount = newGuesses.length;

        let newStatus: GameState['status'] = 'IN_PROGRESS';
        let newRevealStep: RevealStep = gameState.revealStep;

        if (isCorrect) {
            newStatus = 'WON';
            // Update local and global stats
            updateStatsAfterGame(true, guessCount, puzzle.puzzle_id);
            submitGlobalStats(puzzle.puzzle_id, guessCount);
        } else if (guessCount >= MAX_GUESSES) {
            newStatus = 'LOST';
            newRevealStep = 6; // Full reveal on loss
            updateStatsAfterGame(false, guessCount, puzzle.puzzle_id);
            submitGlobalStats(puzzle.puzzle_id, 0); // 0 = loss
        } else {
            // Progress to next reveal step after wrong guess
            newRevealStep = Math.min(gameState.revealStep + 1, 5) as RevealStep;
        }

        setGameState({
            ...gameState,
            guesses: newGuesses,
            status: newStatus,
            revealStep: newRevealStep,
        });
    }, [puzzle, gameState]);

    // Get current reveal state based on game progress
    const revealState = REVEAL_STATES[gameState?.revealStep ?? 0];

    return {
        puzzle,
        gameState,
        isLoading,
        error,
        makeGuess,
        revealState,
    };
}

// Helper to submit stats to global tracker
async function submitGlobalStats(date: string, guessNumber: number) {
    try {
        await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, guess_number: guessNumber }),
        });
    } catch (e) {
        console.error('Failed to submit global stats:', e);
    }
}

