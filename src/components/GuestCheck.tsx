'use client';

import { useState, useEffect, useRef } from 'react';
import { EpisodeSearchResult, GuessAttempt } from '@/types/episode';

interface GuestCheckProps {
    onGuess: (episode: EpisodeSearchResult) => void;
    guessesUsed: number;
    maxGuesses: number;
    disabled: boolean;
    guessedIds: string[];
    guesses?: GuessAttempt[];
}

export function GuestCheck({ onGuess, guessesUsed, maxGuesses, disabled, guessedIds, guesses = [] }: GuestCheckProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EpisodeSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSearchResult | null>(null);
    const [tappedIndex, setTappedIndex] = useState<number | null>(null); // For two-tap mobile selection
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Random order number for receipt
    const [orderNumber] = useState(() => Math.floor(Math.random() * 90000) + 10000);

    // Search episodes
    useEffect(() => {
        const searchEpisodes = async () => {
            // Don't search if an episode is already selected
            if (selectedEpisode) {
                setResults([]);
                setShowDropdown(false);
                return;
            }

            if (query.length < 2) {
                setResults([]);
                setShowDropdown(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/episodes?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                // Filter out already guessed episodes
                const filtered = (data.episodes || []).filter(
                    (ep: EpisodeSearchResult) => !guessedIds.includes(ep.id)
                );

                setResults(filtered);
                setShowDropdown(filtered.length > 0);
                setSelectedIndex(-1);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(searchEpisodes, 300);
        return () => clearTimeout(debounce);
    }, [query, guessedIds, selectedEpisode]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleSelect(results[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const handleSelect = (episode: EpisodeSearchResult) => {
        // Populate the input with the selected episode, but don't submit
        setSelectedEpisode(episode);
        setQuery(`${formatEpisodeCode(episode.season, episode.episode_number)} - ${episode.title}`);
        setResults([]);
        setShowDropdown(false);
        setTappedIndex(null);
        inputRef.current?.focus();
    };

    // Handle click/tap on dropdown item - two-tap for mobile only
    const handleItemClick = (episode: EpisodeSearchResult, index: number) => {
        // Check if device has hover capability (desktop) vs touch-only (mobile)
        const hasHover = window.matchMedia('(hover: hover)').matches;

        if (hasHover) {
            // Desktop: select immediately on click
            handleSelect(episode);
        } else {
            // Mobile: require two taps
            if (tappedIndex === index) {
                handleSelect(episode);
            } else {
                // First tap: expand the synopsis
                setSelectedIndex(index);
                setTappedIndex(index);
            }
        }
    };


    const handleSubmit = () => {
        if (selectedEpisode) {
            onGuess(selectedEpisode);
            setQuery('');
            setSelectedEpisode(null);
            inputRef.current?.focus();
        }
    };

    const formatEpisodeCode = (season: number, episode: number) => {
        return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    };

    // Generate burger indicators
    const burgerIndicators = Array.from({ length: maxGuesses }, (_, i) => (
        <span key={i} className={`burger-indicator ${i < guessesUsed ? 'used' : ''}`}>
            🍔
        </span>
    ));

    return (
        <div className="guest-check">
            {/* Header */}
            <div className="guest-check-header">
                <div className="guest-check-title">GUEST CHECK</div>
                <div className="guest-check-meta">
                    <div className="guest-check-number">#{orderNumber}</div>
                    <div className="guest-check-table">TABLE 5 - 4 GUESTS</div>
                </div>
            </div>

            {/* Take Order Section */}
            <div className="take-order-section">
                <div className="take-order-label">Take Order (Guess the Episode)</div>
            </div>

            {/* Input Body */}
            <div className="guest-check-body">
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setSelectedEpisode(null); // Clear selection when user types
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => results.length > 0 && setShowDropdown(true)}
                        placeholder="Start typing episode title..."
                        disabled={disabled}
                        className="guest-check-input"
                    />

                    {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-(--mustard-yellow) border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Dropdown results */}
                    {showDropdown && (
                        <div
                            ref={dropdownRef}
                            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                        >
                            {results.map((episode, index) => (
                                <button
                                    key={episode.id}
                                    onClick={() => handleItemClick(episode, index)}

                                    className={`
                                        w-full px-4 py-3 text-left flex flex-col gap-1 transition-colors group
                                        ${index === selectedIndex ? 'bg-[--mustard-yellow]/20' : 'hover:bg-gray-100'}
                                        ${index !== 0 ? 'border-t border-gray-200' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm font-bold text-[--ketchup-red] shrink-0">
                                            {formatEpisodeCode(episode.season, episode.episode_number)}
                                        </span>
                                        <span className="text-[--chalkboard-black] font-medium">
                                            {episode.title}
                                        </span>
                                    </div>
                                    {episode.synopsis && (
                                        <p className={`
                                            text-sm text-gray-500 pl-[4.5rem]
                                            ${index === selectedIndex ? '' : 'line-clamp-1 group-hover:line-clamp-none'}
                                        `}>
                                            {episode.synopsis}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>


                {/* Order Up Button */}
                <button
                    onClick={handleSubmit}
                    disabled={disabled || !selectedEpisode}
                    className="order-up-button"
                >
                    Order Up!
                </button>

                {/* Burger Indicators */}
                <div className="burger-indicators">
                    {burgerIndicators}
                </div>
            </div>

            {/* Order History */}
            {guesses.length > 0 && (
                <div className="order-history">
                    <div className="order-history-title">Order History</div>
                    <div className="order-history-list">
                        {guesses.map((guess) => (
                            <div key={guess.episode.id} className="order-history-item">
                                <span className="order-history-text">S{guess.episode.season}E{guess.episode.episode_number} - {guess.episode.title}</span>
                                <span className={`order-history-icon ${guess.isCorrect ? 'correct' : 'incorrect'}`}>
                                    {guess.isCorrect ? '✓' : '✗'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
