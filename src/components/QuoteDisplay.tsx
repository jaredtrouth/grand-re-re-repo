'use client';

import { EpisodeQuote } from '@/types/episode';

interface QuoteDisplayProps {
    quote: EpisodeQuote | null;
    showAttribution: boolean;
}

/**
 * Subtitle-style quote component.
 * Features:
 * - Quote text always visible (if quote exists)
 * - Speaker attribution hidden until revealed
 * - Styled as TV subtitles
 */
export function QuoteDisplay({ quote, showAttribution }: QuoteDisplayProps) {
    if (!quote) {
        return (
            <div className="quote-container quote-empty">
                <p className="quote-placeholder">No quote available for this episode</p>
            </div>
        );
    }

    return (
        <div className="quote-container">
            {/* Quote text */}
            <blockquote className="quote-text">
                &ldquo;{quote.text}&rdquo;
            </blockquote>

            {/* Attribution */}
            <div className="quote-attribution">
                {showAttribution && quote.speaker ? (
                    <span className="quote-speaker">— {quote.speaker}</span>
                ) : (
                    <span className="quote-speaker-hidden">— ??? @ ????</span>
                )}
            </div>
        </div>
    );
}
