import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Demo mode burgers for development/preview
const DEMO_BURGERS = [
    {
        id: 'demo-burger-001',
        episode_id: 'demo-ep-001',
        name: 'The Cauliflower\'s Cumin From Inside the House Burger',
        description: null,
        episode: { season: 3, episode_number: 12, title: 'Broadcast Wagstaff School News' },
        store_next_door: 'Dream Weavers: Hair Rugs',
        pest_control: 'We\'ll Check Your Crawl Spaces Exterminators',
        other_burgers: null,
        plot_summary: 'Tina becomes a reporter for the school news and uncovers a mystery involving the "Mad Pooper" terrorizing the school.',
    },
    {
        id: 'demo-burger-002',
        episode_id: 'demo-ep-002',
        name: 'The Garden of Eden Burger',
        description: '(comes with salad)',
        episode: { season: 4, episode_number: 3, title: 'Seaplane!' },
        store_next_door: 'Sleep Tight: Small Mattresses for Small People',
        pest_control: 'Rat\'s All Folks! Exterminators',
        other_burgers: null,
        plot_summary: 'Linda takes a spontaneous seaplane trip with a handsome pilot named Kurt, leading to romantic complications.',
    },
    {
        id: 'demo-burger-003',
        episode_id: 'demo-ep-003',
        name: 'Paranormal Pepper Jack Activity Burger',
        description: null,
        episode: { season: 5, episode_number: 2, title: 'Tina and the Real Ghost' },
        store_next_door: 'Oil\'s Well That Ends Well (Art Supplies)',
        pest_control: 'Ghost Busted Exterminators',
        other_burgers: 'The Boo-ger, Ghoul-ash Burger',
        plot_summary: 'Tina falls in love with a "ghost" named Jeff who supposedly lives in a shoebox, but Louise has other plans.',
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

// GET /api/daily - Get today's puzzle based on UTC server time
export async function GET() {
    try {
        // Get current UTC date
        const now = new Date();
        const utcDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

        // If Supabase is not configured, use demo mode
        if (!isSupabaseConfigured()) {
            console.log('Running in DEMO MODE - Supabase not configured');

            // Select a demo burger based on day of year for variety
            const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            const demoBurger = DEMO_BURGERS[dayOfYear % DEMO_BURGERS.length];

            const answerHash = createHash('sha256').update(demoBurger.id).digest('hex');

            return NextResponse.json({
                puzzle_id: utcDate,
                answer_hash: answerHash,
                hints: {
                    burger_name: demoBurger.name,
                    burger_description: demoBurger.description,
                    store_next_door: demoBurger.store_next_door,
                    pest_control: demoBurger.pest_control,
                    other_burgers: demoBurger.other_burgers,
                    plot_summary: demoBurger.plot_summary,
                },
                episode: demoBurger.episode,
                demo_mode: true,
            });
        }

        // Production mode - use Supabase
        const { createServerClient } = await import('@/lib/supabase');
        const supabase = createServerClient();

        // Fetch puzzle using RPC function
        const { data, error } = await supabase
            .rpc('get_daily_puzzle', { puzzle_date: utcDate });

        if (error) {
            console.error('Error fetching daily puzzle:', error);
            return NextResponse.json(
                { error: 'Failed to fetch puzzle' },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'No puzzle available for today' },
                { status: 404 }
            );
        }

        const puzzle = data[0];

        // Return puzzle with hints
        return NextResponse.json({
            puzzle_id: puzzle.puzzle_id,
            answer_hash: puzzle.answer_hash,
            hints: {
                burger_name: puzzle.burger_name,
                burger_description: puzzle.burger_description,
                store_next_door: puzzle.store_next_door,
                pest_control: puzzle.pest_control,
                other_burgers: puzzle.other_burgers,
                plot_summary: puzzle.plot_summary,
            },
            episode: {
                season: puzzle.episode_season,
                episode_number: puzzle.episode_number,
                title: puzzle.episode_title,
            },
        });
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
