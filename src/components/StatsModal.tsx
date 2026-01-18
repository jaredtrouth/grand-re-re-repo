'use client';

import { LocalStats } from '@/types/episode';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: LocalStats;
}

export function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
    if (!isOpen) return null;

    const maxDistribution = Math.max(
        ...Object.values(stats.guessDistribution),
        1
    );

    return (
        <div
            className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="modal-content w-full max-w-md p-6 space-y-6 animate-bounce-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="modal-header">
                        📊 Statistics
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-black/10 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-4 text-center">
                    <StatBox label="Played" value={stats.gamesPlayed} />
                    <StatBox label="Win %" value={stats.winPercentage} />
                    <StatBox label="Streak" value={stats.currentStreak} />
                    <StatBox label="Max" value={stats.maxStreak} />
                </div>

                {/* Guess distribution */}
                <div className="space-y-3">
                    <h3 className="font-handwritten text-xl text-(--chalkboard-black)">
                        Guess Distribution
                    </h3>
                    <div className="space-y-2">
                        {([1, 2, 3, 4, 5, 6] as const).map((guess) => {
                            const count = stats.guessDistribution[guess];
                            const width = (count / maxDistribution) * 100;

                            return (
                                <div key={guess} className="flex items-center gap-2">
                                    <span className="w-4 text-sm font-bold text-(--chalkboard-black)">
                                        {guess}
                                    </span>
                                    <div className="flex-1 h-6 bg-(--chalkboard-black)/10 rounded overflow-hidden">
                                        <div
                                            className="stat-bar flex items-center justify-end px-2 transition-all duration-500"
                                            style={{ width: `${Math.max(width, count > 0 ? 10 : 0)}%` }}
                                        >
                                            {count > 0 && (
                                                <span className="text-xs font-bold text-(--chalkboard-black)">{count}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: number }) {
    return (
        <div className="space-y-1">
            <div className="text-2xl font-handwritten font-bold text-(--chalkboard-black)">
                {value}
            </div>
            <div className="text-xs text-(--chalkboard-black)/70 uppercase font-bold">
                {label}
            </div>
        </div>
    );
}
