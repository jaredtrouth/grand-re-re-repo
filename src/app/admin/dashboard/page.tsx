'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminSession, signOutAdmin } from '@/lib/adminAuth';
import EpisodeEditor from '@/components/admin/EpisodeEditor';
import PuzzleScheduler from '@/components/admin/PuzzleScheduler';

interface Episode {
    id: string;
    season: number;
    episode_number: number;
    title: string;
    quote_text: string | null;
    quote_speaker: string | null;
    quote_location: string | null;
    still_url: string | null;
    store_next_door: string | null;
    pest_control_truck: string | null;
    original_air_date: string | null;
    guest_stars: string | null;
}

interface Burger {
    id: string;
    name: string;
    description: string | null;
    episode_id: string;
}

export default function AdminDashboard() {
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [burgers, setBurgers] = useState<Burger[]>([]);
    const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [seasonFilter, setSeasonFilter] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'episodes' | 'puzzles'>('episodes');
    const router = useRouter();

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            const session = await getAdminSession();
            if (!session) {
                router.push('/admin');
            }
        };
        checkSession();
    }, [router]);

    // Fetch episodes
    const fetchEpisodes = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (seasonFilter) params.set('season', seasonFilter.toString());

            const response = await fetch(`/api/admin/episodes?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEpisodes(data.episodes);
                setBurgers(data.burgers || []);
            }
        } catch (error) {
            console.error('Failed to fetch episodes:', error);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, seasonFilter]);

    useEffect(() => {
        fetchEpisodes();
    }, [fetchEpisodes]);

    const handleSignOut = async () => {
        await signOutAdmin();
        router.push('/admin');
    };

    const handleEpisodeSave = async () => {
        setSelectedEpisode(null);
        await fetchEpisodes();
    };

    const uniqueSeasons = [...new Set(episodes.map(ep => ep.season))].sort((a, b) => a - b);

    const filteredEpisodes = episodes.filter(ep => {
        const matchesSearch = !searchTerm ||
            ep.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `S${ep.season}E${ep.episode_number}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSeason = !seasonFilter || ep.season === seasonFilter;
        return matchesSearch && matchesSeason;
    });

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>🍔 Puzzle Admin</h1>
                <div className="admin-header-actions">
                    <button onClick={handleSignOut} className="admin-button admin-button-secondary">
                        Sign Out
                    </button>
                </div>
            </header>

            <nav className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === 'episodes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('episodes')}
                >
                    Episodes
                </button>
                <button
                    className={`admin-tab ${activeTab === 'puzzles' ? 'active' : ''}`}
                    onClick={() => setActiveTab('puzzles')}
                >
                    Puzzle Schedule
                </button>
            </nav>

            <main className="admin-main">
                {activeTab === 'episodes' && (
                    <div className="admin-episodes">
                        <div className="admin-filters">
                            <input
                                type="text"
                                placeholder="Search episodes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="admin-input admin-search"
                            />
                            <select
                                value={seasonFilter || ''}
                                onChange={(e) => setSeasonFilter(e.target.value ? Number(e.target.value) : null)}
                                className="admin-select"
                            >
                                <option value="">All Seasons</option>
                                {uniqueSeasons.map(season => (
                                    <option key={season} value={season}>Season {season}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="admin-loading">Loading episodes...</div>
                        ) : (
                            <div className="admin-episode-list">
                                {filteredEpisodes.map(episode => {
                                    const episodeBurgers = burgers.filter(b => b.episode_id === episode.id);
                                    const hasMissingData = !episode.quote_text || !episode.still_url;

                                    return (
                                        <div
                                            key={episode.id}
                                            className={`admin-episode-card ${hasMissingData ? 'incomplete' : ''}`}
                                            onClick={() => setSelectedEpisode(episode)}
                                        >
                                            <div className="admin-episode-header">
                                                <span className="admin-episode-code">
                                                    S{episode.season}E{episode.episode_number}
                                                </span>
                                                {hasMissingData && (
                                                    <span className="admin-badge admin-badge-warning">Incomplete</span>
                                                )}
                                            </div>
                                            <h3 className="admin-episode-title">{episode.title}</h3>
                                            <div className="admin-episode-meta">
                                                {episodeBurgers.length > 0 && (
                                                    <span>🍔 {episodeBurgers[0].name}</span>
                                                )}
                                                {episode.store_next_door && (
                                                    <span>🏪 {episode.store_next_door.substring(0, 20)}...</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'puzzles' && (
                    <PuzzleScheduler episodes={episodes} burgers={burgers} />
                )}
            </main>

            {selectedEpisode && (
                <EpisodeEditor
                    episode={selectedEpisode}
                    burgers={burgers.filter(b => b.episode_id === selectedEpisode.id)}
                    onClose={() => setSelectedEpisode(null)}
                    onSave={handleEpisodeSave}
                />
            )}
        </div>
    );
}
