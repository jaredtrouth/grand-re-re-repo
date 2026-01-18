'use client';

import { GuessAttempt } from '@/types/episode';

interface GuessRowProps {
    guess: GuessAttempt;
    index: number;
}

export function GuessRow({ guess, index }: GuessRowProps) {
    const { episode, isCorrect } = guess;

    const formatEpisodeCode = (season: number, episodeNum: number) => {
        return `S${String(season).padStart(2, '0')}E${String(episodeNum).padStart(2, '0')}`;
    };

    return (
        <div
            className={`guess-row flex items-center gap-3 ${isCorrect ? 'correct' : 'incorrect'}`}
            style={{
                animationDelay: `${index * 50}ms`,
            }}
        >
            {/* Guess number */}
            <div className={`
        flex items-center justify-center w-8 h-8 rounded-full font-handwritten text-lg font-bold
        ${isCorrect
                    ? 'bg-(--lettuce-green) text-(--chalkboard-black)'
                    : 'bg-(--ketchup-red) text-white'
                }
      `}>
                {index + 1}
            </div>

            {/* Episode info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`
            font-mono text-sm font-bold
            ${isCorrect ? 'text-(--lettuce-green)' : 'text-(--ketchup-red)'}
          `}>
                        {formatEpisodeCode(episode.season, episode.episode_number)}
                    </span>
                    <span className="truncate">
                        {episode.title}
                    </span>
                </div>
            </div>

            {/* Result icon */}
            <div className="shrink-0">
                {isCorrect ? (
                    <svg className="w-6 h-6 text-(--lettuce-green)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-(--ketchup-red)" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                    </svg>
                )}
            </div>
        </div>
    );
}

interface GuessListProps {
    guesses: GuessAttempt[];
}

export function GuessList({ guesses }: GuessListProps) {
    if (guesses.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {guesses.map((guess, index) => (
                <GuessRow key={guess.episode.id} guess={guess} index={index} />
            ))}
        </div>
    );
}
