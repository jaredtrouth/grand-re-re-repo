'use client';

import { useState, useEffect } from 'react';
import { GameState, MAX_GUESSES } from '@/types/episode';
import { generateShareText, getLocalStats } from '@/lib/localStorage';

interface GameOverModalProps {
    isOpen: boolean;
    gameState: GameState;
    puzzleDate: string;
    burgerName?: string;
    correctEpisode?: {
        season: number;
        episode_number: number;
        title: string;
    };
}

export function GameOverModal({ isOpen, gameState, puzzleDate, burgerName, correctEpisode }: GameOverModalProps) {
    const [copied, setCopied] = useState(false);
    const [countdown, setCountdown] = useState('');
    const stats = getLocalStats();

    const won = gameState.status === 'WON';
    const guessCount = gameState.guesses.length;

    // Countdown to next puzzle
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            tomorrow.setUTCHours(0, 0, 0, 0);

            const diff = tomorrow.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleShare = async () => {
        const text = generateShareText(puzzleDate, won, guessCount, MAX_GUESSES);

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    const formatEpisodeCode = (season: number, episode: number) => {
        return `Season ${season}, Episode ${episode}`;
    };

    return (
        <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Clipboard frame */}
            <div className="clipboard-modal w-full max-w-md animate-bounce-in">
                {/* Metal clip at top */}
                <div className="clipboard-clip" />

                {/* Paper content */}
                <div className="clipboard-paper text-center">
                    {/* Stamp */}
                    <div className={won ? 'order-up-stamp animate-stamp' : 'kitchen-closed-stamp animate-stamp'}>
                        {won ? 'ORDER UP!' : 'KITCHEN CLOSED!'}
                    </div>

                    {/* Burger name */}
                    {burgerName && (
                        <div className="mt-4">
                            <p className="text-sm text-(--chalkboard-black)/60 uppercase tracking-wide">Today's Burger</p>
                            <h2 className="font-handwritten text-2xl text-(--ketchup-red) mb-1">
                                {burgerName}
                            </h2>
                        </div>
                    )}

                    {/* Episode info */}
                    {correctEpisode && (
                        <div className="mt-3">
                            <p className="text-sm text-(--chalkboard-black)/60 uppercase tracking-wide">From Episode</p>
                            <h3 className="font-handwritten text-xl text-(--chalkboard-black) mb-1">
                                &quot;{correctEpisode.title}&quot;
                            </h3>
                            <p className="text-(--chalkboard-black)/80 text-sm">
                                {formatEpisodeCode(correctEpisode.season, correctEpisode.episode_number)}
                            </p>
                        </div>
                    )}

                    {/* Receipt card */}
                    <div className="receipt-card mt-6">
                        <div className="receipt-header">GUEST CHECK</div>

                        <div className="receipt-row">
                            <span>STREAK:</span>
                            <span className="font-bold">{stats.currentStreak} DAYS</span>
                        </div>
                        <div className="receipt-row">
                            <span>GUESSES:</span>
                            <span className="font-bold">{guessCount}</span>
                        </div>

                        <button
                            onClick={handleShare}
                            className="share-btn"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            {copied ? 'Copied!' : 'Share'}
                        </button>

                        {/* Burger illustration */}
                        <div className="text-4xl mt-3">🍔</div>
                    </div>

                    {/* Watch link */}
                    <a
                        href="https://www.hulu.com/series/bobs-burgers-fdeb1018-4472-442f-ba94-fb087cdea069"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="watch-link"
                    >
                        Watch on Hulu / Disney+
                    </a>

                    {/* Countdown */}
                    <div className="mt-4 pt-4 border-t border-(--chalkboard-black)/10">
                        <p className="text-sm text-(--chalkboard-black)/60">Next order in</p>
                        <p className="font-mono text-xl font-bold text-(--chalkboard-black)">{countdown}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
