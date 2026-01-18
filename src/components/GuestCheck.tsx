'use client';

import { useState, useEffect, useRef } from 'react';
import { EpisodeSearchResult } from '@/types/episode';

interface GuestCheckProps {
    onGuess: (episode: EpisodeSearchResult) => void;
    guessesUsed: number;
    maxGuesses: number;
    disabled: boolean;
    guessedIds: string[];
}

export function GuestCheck({ onGuess, guessesUsed, maxGuesses, disabled, guessedIds }: GuestCheckProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EpisodeSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedEpisode, setSelectedEpisode] = useState<EpisodeSearchResult | null>(null);
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
        inputRef.current?.focus();
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
            {/* Header with spiral binding - created via CSS ::before */}
            <div className="guest-check-header">
                <div>
                    <div className="guest-check-title">GUEST CHECK</div>
                    <div className="text-xs text-(--chalkboard-black) opacity-50 mt-1">
                        TABLE 5 • 4 GUESTS
                    </div>
                </div>
                <div className="guest-check-number">#{orderNumber}</div>
            </div>

            <div className="guest-check-body">
                <div className="guest-check-label">
                    TAKE ORDER (GUESS THE EPISODE)
                </div>

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
                            className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {results.map((episode, index) => (
                                <button
                                    key={episode.id}
                                    onClick={() => handleSelect(episode)}
                                    className={`
                    w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                    ${index === selectedIndex ? 'bg-[--mustard-yellow]/20' : 'hover:bg-gray-100'}
                    ${index !== 0 ? 'border-t border-gray-200' : ''}
                  `}
                                >
                                    <span className="font-mono text-sm font-bold text-[--ketchup-red]">
                                        {formatEpisodeCode(episode.season, episode.episode_number)}
                                    </span>
                                    <span className="text-[--chalkboard-black] truncate">
                                        {episode.title}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className="burger-indicators">
                        {burgerIndicators}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={disabled || !selectedEpisode}
                        className="btn-primary"
                    >
                        Order Up! 🔔
                    </button>
                </div>
            </div>

            <div className="guest-check-footer">
                <span>TAX INCLUDED</span>
                <span>THANK YOU!</span>
            </div>
        </div>
    );
}
