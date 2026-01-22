'use client';

import { useState, useEffect } from 'react';

interface EpisodeStillProps {
    stillUrl: string | null;
    isVisible: boolean;
    isBlurred: boolean;
}


/**
 * Episode still image component (frameless design).
 * Features:
 * - Hidden state with placeholder
 * - Blurred state with CSS filter
 * - Clear state with full reveal
 * - Image preloading to prevent flash of unblurred content
 */
export function EpisodeStill({
    stillUrl,
    isVisible,
    isBlurred,
}: EpisodeStillProps) {

    const [imageLoaded, setImageLoaded] = useState(false);

    // Preload image to prevent flash of unblurred content
    useEffect(() => {
        if (!stillUrl) {
            setImageLoaded(false);
            return;
        }

        setImageLoaded(false);
        const img = new Image();
        img.onload = () => setImageLoaded(true);
        img.onerror = () => setImageLoaded(false);
        img.src = stillUrl;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [stillUrl]);

    // Determine if we should show the image (loaded and visible)
    const showImage = isVisible && stillUrl && imageLoaded;

    return (
        <div className="episode-still-container">
            {/* Image area */}
            <div className="episode-still">
                {/* Content */}
                {!isVisible ? (
                    // Hidden placeholder
                    <div className="still-placeholder">
                        <div className="still-placeholder-icon">📺</div>
                        <p className="still-placeholder-text">Signal Incoming...</p>
                    </div>
                ) : showImage ? (
                    // Episode still image (only shown after preloaded)
                    <div
                        className={`still-image ${isBlurred ? 'still-image-blurred' : 'still-image-clear'}`}
                        style={{ backgroundImage: `url(${stillUrl})` }}
                        role="img"
                        aria-label="Episode still"
                    />
                ) : stillUrl ? (
                    // Loading state while image preloads
                    <div className="still-placeholder">
                        <div className="still-placeholder-icon">⏳</div>
                        <p className="still-placeholder-text">Loading...</p>
                    </div>
                ) : (
                    // No image available
                    <div className="still-placeholder">
                        <div className="still-placeholder-icon">🎬</div>
                        <p className="still-placeholder-text">No Still Available</p>
                    </div>
                )}
            </div>
        </div>
    );
}

