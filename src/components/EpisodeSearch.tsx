'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EpisodeSearchResult } from '@/types/episode';

interface EpisodeSearchProps {
    onSelect: (episode: EpisodeSearchResult) => void;
    disabled?: boolean;
    disabledIds?: string[];
}

export function EpisodeSearch({ onSelect, disabled, disabledIds = [] }: EpisodeSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<EpisodeSearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length < 1) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`/api/episodes?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                setResults(data.episodes || []);
                setSelectedIndex(0);
            } catch (e) {
                console.error('Search failed:', e);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [query]);

    // Handle selection
    const handleSelect = useCallback((episode: EpisodeSearchResult) => {
        onSelect(episode);
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    }, [onSelect]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected && !disabledIds.includes(selected.id)) {
                    handleSelect(selected);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    }, [isOpen, results, selectedIndex, disabledIds, handleSelect]);

    // Format episode code (S01E05)
    const formatEpisodeCode = (season: number, episode: number) => {
        return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Search episodes... (e.g. 'Wagstaff' or 'S03E12')"
                    className="search-input w-full"
                />

                {/* Loading spinner */}
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-(--mustard-yellow) border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Results dropdown */}
            {isOpen && results.length > 0 && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-2 bg-(--card-bg) border-2 border-(--burger-bun-brown) rounded-xl shadow-lg max-h-64 overflow-auto"
                >
                    {results.map((episode, index) => {
                        const isDisabled = disabledIds.includes(episode.id);
                        const isSelected = index === selectedIndex;

                        return (
                            <li key={episode.id}>
                                <button
                                    type="button"
                                    onClick={() => !isDisabled && handleSelect(episode)}
                                    disabled={isDisabled}
                                    className={`
                    w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                    ${isSelected ? 'bg-(--burger-bun-brown)/30' : ''}
                    ${isDisabled
                                            ? 'opacity-40 cursor-not-allowed'
                                            : 'hover:bg-(--burger-bun-brown)/20'
                                        }
                  `}
                                >
                                    <span className="font-mono text-sm font-bold text-(--mustard-yellow)">
                                        {formatEpisodeCode(episode.season, episode.episode_number)}
                                    </span>
                                    <span className="text-(--chalk-white) truncate">
                                        {episode.title}
                                    </span>
                                    {isDisabled && (
                                        <span className="ml-auto text-xs text-(--chalk-gray)">Already ordered</span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* No results message */}
            {isOpen && query.length > 0 && !isLoading && results.length === 0 && (
                <div className="absolute z-50 w-full mt-2 p-4 bg-(--card-bg) border-2 border-(--card-border) rounded-xl shadow-lg text-center text-(--chalk-gray)">
                    No episodes found for &quot;{query}&quot;
                </div>
            )}
        </div>
    );
}
