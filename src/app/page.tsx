'use client';

import { useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { EpisodeStill } from '@/components/EpisodeStill';
import { QuoteDisplay } from '@/components/QuoteDisplay';
import { GuestCheck } from '@/components/GuestCheck';
import { StatsModal } from '@/components/StatsModal';
import { HelpModal } from '@/components/HelpModal';
import { GameOverModal } from '@/components/GameOverModal';
import { getLocalStats } from '@/lib/localStorage';
import { MAX_GUESSES } from '@/types/episode';


export default function Home() {
  const {
    puzzle,
    gameState,
    isLoading,
    error,
    makeGuess,
    revealState
  } = useGameState();

  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const guessedIds = gameState?.guesses.map(g => g.episode.id) ?? [];
  const isGameOver = gameState?.status === 'WON' || gameState?.status === 'LOST';
  const correctEpisode = isGameOver
    ? (gameState?.guesses.find(g => g.isCorrect)?.episode ?? puzzle?.episode)
    : undefined;

  const stats = getLocalStats();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-bounce">🍔</div>
          <p className="text-lg text-(--chalk-gray) font-handwritten">
            Firing up the grill...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wood-frame max-w-md">
          <div className="chalkboard text-center p-8">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="font-handwritten text-2xl text-(--mustard-yellow) mb-2">
              Order&apos;s Up... Wrong!
            </h1>
            <p className="text-(--chalk-gray) mb-6">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="header sticky top-0 z-40">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between relative">

          {/* Left - Help button */}
          <button onClick={() => setShowHelp(true)} className="header-btn" aria-label="Help">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Center - Logo banner */}
          <div className="logo-banner absolute left-1/2 -translate-x-1/2">
            <span className="logo-text">Burger of the Day<span className="paper-anchor"><span className="scrap-paper">-dle</span></span></span>
          </div>

          {/* Right - Stats */}
          <div className="flex items-center gap-4">
            <div className="header-stat hidden md:block">
              <div className="header-stat-label">STREAK</div>
              <div className="header-stat-value">{stats.currentStreak} Days</div>
            </div>
            <div className="header-stat hidden md:block">
              <div className="header-stat-label">SCORE</div>
              <div className="header-stat-value">{stats.gamesWon * 100}</div>
            </div>
            <button onClick={() => setShowStats(true)} className="header-btn" aria-label="Stats">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6">
        <div className="game-layout">
          {/* Left/Top - Chalkboard section */}
          <div className="wood-frame">
            <div className="chalkboard">
              {/* Header row with date */}
              <div className="flex items-start justify-center mb-2">
                <div className="text-center">
                  <h2 className="todays-special text-xl md:text-2xl mb-0">Today&apos;s Special</h2>
                  <p className="todays-special-date text-xs">
                    {puzzle ? formatDate(puzzle.puzzle_id) : ''}
                  </p>
                </div>
              </div>

              {/* Burger Name (Anchor) with Season/Episode */}
              {puzzle?.burger && (
                <h3 className="burger-name text-center text-xl md:text-2xl mb-4">
                  {puzzle.burger.name}
                  {puzzle?.episode && (
                    <span className="text-base font-normal">
                      {' '}(S{revealState.seasonVisible
                        ? String(puzzle.episode.season).padStart(2, '0')
                        : '??'}E{isGameOver
                          ? String(puzzle.episode.episode_number).padStart(2, '0')
                          : '??'})
                    </span>
                  )}
                </h3>
              )}

              <div className="chalkboard-tv-clue">
                <EpisodeStill
                  stillUrl={puzzle?.still_url ?? null}
                  isVisible={revealState.stillVisible}
                  isBlurred={revealState.stillBlurred}
                />

                <div className="chalkboard-clue-section hidden max-lg:flex flex-col gap-2">
                  {puzzle?.quote && (
                    <div>
                      <span className="clue-label">Quote:</span>
                      <p className="clue-text">
                        &quot;{puzzle.quote.text}&quot;
                        {revealState.quoteAttributionVisible && puzzle.quote.speaker && (
                          <> - {puzzle.quote.speaker}</>
                        )}
                      </p>
                    </div>
                  )}
                </div>

              </div>

              <div className="hidden lg:block">
                <QuoteDisplay
                  quote={puzzle?.quote ?? null}
                  showAttribution={revealState.quoteAttributionVisible}
                />
              </div>

              <div className="hints-inline">
                <div className="hint-inline-item">
                  <span className="hint-inline-label">Store Next Door</span>
                  {revealState.storeVisible ? (
                    <span>&quot;{puzzle?.hints.store_next_door || 'Not shown'}&quot;</span>
                  ) : (
                    <span className="text-(--chalk-gray)">🔒</span>
                  )}
                </div>
                <div className="hint-inline-item">
                  <span className="hint-inline-label">Pest Control Truck</span>
                  {revealState.pestControlVisible ? (
                    <span>&quot;{puzzle?.hints.pest_control || 'Not shown'}&quot;</span>
                  ) : (
                    <span className="text-(--chalk-gray)">🔒</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isGameOver && (
            <GuestCheck
              onGuess={makeGuess}
              guessesUsed={gameState?.guesses.length ?? 0}
              maxGuesses={MAX_GUESSES}
              disabled={isGameOver}
              guessedIds={guessedIds}
              guesses={gameState?.guesses ?? []}
            />
          )}
        </div>
      </main>


      {/* Footer */}
      <footer className="py-4 text-center text-xl text-(--blackboard-black) font-handwritten">
        Made with 🍔 by fans, for fans
      </footer>

      {/* Modals */}
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} stats={stats} />
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {isGameOver && gameState && puzzle && (
        <GameOverModal
          isOpen={true}
          gameState={gameState}
          puzzleDate={puzzle.puzzle_id}
          burgerName={puzzle.burger.name}
          correctEpisode={correctEpisode ? {
            season: correctEpisode.season,
            episode_number: correctEpisode.episode_number,
            title: correctEpisode.title,
          } : undefined}
        />
      )}
    </div>
  );
}
