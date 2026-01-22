'use client';

import { useEffect, useState, useCallback } from 'react';

interface Episode {
    id: string;
    season: number;
    episode_number: number;
    title: string;
    quote_text: string | null;
    still_url: string | null;
}

interface Burger {
    id: string;
    name: string;
    episode_id: string;
}

interface DailyPuzzle {
    date: string;
    burger_id: string;
    burger_name?: string;
    episode_title?: string;
    season?: number;
    episode_number?: number;
}

interface PuzzleSchedulerProps {
    episodes: Episode[];
    burgers: Burger[];
}

export default function PuzzleScheduler({ episodes, burgers }: PuzzleSchedulerProps) {
    const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedBurger, setSelectedBurger] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    // Get a 30-day range centered around today
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 23);

    const fetchPuzzles = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0],
            });

            const response = await fetch(`/api/admin/puzzles?${params}`);
            if (response.ok) {
                const data = await response.json();
                setPuzzles(data.puzzles);
            }
        } catch (error) {
            console.error('Failed to fetch puzzles:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPuzzles();
    }, [fetchPuzzles]);

    // Generate array of dates for calendar
    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    const getPuzzleForDate = (date: string) => puzzles.find(p => p.date === date);
    const todayStr = today.toISOString().split('T')[0];

    const handleSchedule = async () => {
        if (!selectedDate || !selectedBurger) return;

        setError('');
        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/puzzles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: selectedDate,
                    burger_id: selectedBurger,
                }),
            });

            if (response.ok) {
                await fetchPuzzles();
                setSelectedDate(null);
                setSelectedBurger('');
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to schedule puzzle');
            }
        } catch {
            setError('Failed to schedule puzzle');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (date: string) => {
        if (!confirm('Remove this scheduled puzzle?')) return;

        try {
            const response = await fetch('/api/admin/puzzles', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });

            if (response.ok) {
                await fetchPuzzles();
            }
        } catch (error) {
            console.error('Failed to delete puzzle:', error);
        }
    };

    // Build burger options with episode info
    const burgerOptions = burgers.map(burger => {
        const episode = episodes.find(ep => ep.id === burger.episode_id);
        return {
            ...burger,
            label: episode
                ? `${burger.name} (S${episode.season}E${episode.episode_number})`
                : burger.name,
        };
    }).sort((a, b) => a.label.localeCompare(b.label));

    if (isLoading) {
        return <div className="admin-loading">Loading schedule...</div>;
    }

    return (
        <div className="admin-scheduler">
            <div className="admin-scheduler-header">
                <h2>Puzzle Schedule</h2>
                <p className="admin-scheduler-subtitle">
                    Click a date to schedule a puzzle, or click an existing puzzle to edit/remove.
                </p>
            </div>

            <div className="admin-calendar">
                {dates.map(date => {
                    const puzzle = getPuzzleForDate(date);
                    const isToday = date === todayStr;
                    const isPast = date < todayStr;
                    const isSelected = date === selectedDate;

                    return (
                        <div
                            key={date}
                            className={`admin-calendar-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''} ${puzzle ? 'scheduled' : 'empty'} ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                                if (!isPast) {
                                    setSelectedDate(date);
                                    setSelectedBurger(puzzle?.burger_id || '');
                                }
                            }}
                        >
                            <div className="admin-calendar-date">
                                {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                            {puzzle ? (
                                <div className="admin-calendar-puzzle">
                                    <span className="admin-calendar-burger">🍔 {puzzle.burger_name}</span>
                                    {puzzle.season && puzzle.episode_number && (
                                        <span className="admin-calendar-episode">
                                            S{puzzle.season}E{puzzle.episode_number}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                !isPast && <span className="admin-calendar-empty">No puzzle</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="admin-scheduler-form">
                    <h3>
                        Schedule for {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </h3>

                    <div className="admin-field">
                        <label className="admin-label">Select Burger</label>
                        <select
                            value={selectedBurger}
                            onChange={(e) => setSelectedBurger(e.target.value)}
                            className="admin-select"
                        >
                            <option value="">Choose a burger...</option>
                            {burgerOptions.map(burger => (
                                <option key={burger.id} value={burger.id}>
                                    {burger.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {error && <div className="admin-error">{error}</div>}

                    <div className="admin-form-actions">
                        <button
                            onClick={() => setSelectedDate(null)}
                            className="admin-button admin-button-secondary"
                        >
                            Cancel
                        </button>
                        {getPuzzleForDate(selectedDate) && (
                            <button
                                onClick={() => handleDelete(selectedDate)}
                                className="admin-button admin-button-danger"
                            >
                                Remove
                            </button>
                        )}
                        <button
                            onClick={handleSchedule}
                            disabled={!selectedBurger || isSaving}
                            className="admin-button admin-button-primary"
                        >
                            {isSaving ? 'Saving...' : 'Schedule'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
