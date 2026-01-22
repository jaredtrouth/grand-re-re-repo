import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Demo mode episodes for development/preview
const DEMO_EPISODES = [
    {
        id: 'demo-001',
        season: 3,
        episode_number: 12,
        title: 'Broadcast Wagstaff School News',
        synopsis: 'Tina takes over the school news show.',
    },
    {
        id: 'demo-002',
        season: 4,
        episode_number: 3,
        title: 'Seaplane!',
        synopsis: 'Linda starts an affair with a pilot.',
    },
    {
        id: 'demo-003',
        season: 5,
        episode_number: 2,
        title: 'Tina and the Real Ghost',
        synopsis: 'Tina falls for a ghost named Jeff.',
    },
    {
        id: 'demo-004',
        season: 1,
        episode_number: 1,
        title: 'Human Flesh',
        synopsis: 'Bob faces rumors that his burgers are made of human flesh.',
    },
    {
        id: 'demo-005',
        season: 2,
        episode_number: 8,
        title: 'Bad Tina',
        synopsis: 'Tina is blackmailed by a bad girl at school.',
    },
    {
        id: 'demo-006',
        season: 6,
        episode_number: 19,
        title: 'Glued, Where\'s My Bob?',
        synopsis: 'Bob gets glued to the toilet before a magazine interview.',
    },
    {
        id: 'demo-007',
        season: 9,
        episode_number: 1,
        title: 'Just One of the Boyz 4 Now for Now',
        synopsis: 'Tina joins a boy band tribute group.',
    },
    {
        id: 'demo-008',
        season: 7,
        episode_number: 7,
        title: 'The Last Gingerbread House on the Left',
        synopsis: 'The Belchers compete in a gingerbread house contest.',
    },
];

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here'
    );
}

// GET /api/episodes?q=search - Search episodes for autocomplete
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';

        // If Supabase is not configured, use demo mode
        if (!isSupabaseConfigured()) {
            console.log('Episodes API: Running in DEMO MODE');

            let filtered = DEMO_EPISODES;

            if (query) {
                const upperQuery = query.toUpperCase();
                const combinedMatch = upperQuery.match(/S(\d+)E(\d+)/);
                const seasonMatch = upperQuery.match(/^S(\d+)$/);
                const episodeMatch = upperQuery.match(/^E(\d+)$/);

                if (combinedMatch) {
                    const season = parseInt(combinedMatch[1], 10);
                    const episodeNum = parseInt(combinedMatch[2], 10);
                    filtered = DEMO_EPISODES.filter(
                        ep => ep.season === season && ep.episode_number === episodeNum
                    );
                } else if (seasonMatch) {
                    const season = parseInt(seasonMatch[1], 10);
                    filtered = DEMO_EPISODES.filter(ep => ep.season === season);
                } else if (episodeMatch) {
                    const episodeNum = parseInt(episodeMatch[1], 10);
                    filtered = DEMO_EPISODES.filter(ep => ep.episode_number === episodeNum);
                } else {
                    filtered = DEMO_EPISODES.filter(
                        ep => ep.title.toLowerCase().includes(query.toLowerCase())
                    );
                }
            }

            const episodes = filtered.map(ep => ({
                id: ep.id,
                season: ep.season,
                episode_number: ep.episode_number,
                title: ep.title,
                synopsis: ep.synopsis,
                hash: createHash('sha256').update(ep.id).digest('hex'),
            }));

            return NextResponse.json({ episodes });
        }

        // Production mode - use Supabase
        const { createServerClient } = await import('@/lib/supabase');
        const supabase = createServerClient();

        // Build query - search by title, or parse "S03E12" format
        let dbQuery = supabase
            .from('episodes')
            .select('id, season, episode_number, title, plot_summary')
            .order('season', { ascending: true })
            .order('episode_number', { ascending: true })
            .limit(20);


        if (query) {
            const upperQuery = query.toUpperCase();
            // Check specific formats
            const combinedMatch = upperQuery.match(/S(\d+)E(\d+)/);
            const seasonMatch = upperQuery.match(/^S(\d+)$/);
            const episodeMatch = upperQuery.match(/^E(\d+)$/);

            if (combinedMatch) {
                const season = parseInt(combinedMatch[1], 10);
                const episodeNum = parseInt(combinedMatch[2], 10);
                dbQuery = dbQuery
                    .eq('season', season)
                    .eq('episode_number', episodeNum);
            } else if (seasonMatch) {
                const season = parseInt(seasonMatch[1], 10);
                dbQuery = dbQuery.eq('season', season);
            } else if (episodeMatch) {
                const episodeNum = parseInt(episodeMatch[1], 10);
                dbQuery = dbQuery.eq('episode_number', episodeNum);
            } else {
                // Search by title (case insensitive)
                dbQuery = dbQuery.ilike('title', `%${query}%`);
            }
        }

        const { data, error } = await dbQuery;

        if (error) {
            console.error('Error searching episodes:', error);
            return NextResponse.json(
                { error: 'Failed to search episodes' },
                { status: 500 }
            );
        }

        // Add hash to each episode for client-side validation
        const episodes = data.map((ep) => ({
            id: ep.id,
            season: ep.season,
            episode_number: ep.episode_number,
            title: ep.title,
            synopsis: ep.plot_summary || undefined,
            hash: createHash('sha256').update(ep.id).digest('hex'),
        }));


        return NextResponse.json({ episodes });
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
