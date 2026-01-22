import { NextResponse } from 'next/server';
import { DailyPuzzle } from '@/types/episode';
import { createServerClient } from '@/lib/supabase';

// GET /api/daily - Get today's puzzle based on UTC server time
export async function GET() {
    try {
        // Get current UTC date
        const now = new Date();
        const utcDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format

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



        // Build response
        const response: DailyPuzzle = {
            puzzle_id: puzzle.puzzle_id,
            answer_hash: puzzle.answer_hash,
            burger: {
                name: puzzle.burger_name || 'Burger of the Day',
                description: puzzle.burger_description,
            },
            quote: puzzle.quote_text ? {
                text: puzzle.quote_text,
                speaker: puzzle.quote_speaker,
            } : null,
            still_url: puzzle.still_url || null,
            hints: {
                store_next_door: puzzle.store_next_door,
                pest_control: puzzle.pest_control,
                original_air_date: puzzle.original_air_date,
                guest_stars: puzzle.guest_stars,
            },
            episode: {
                season: puzzle.episode_season,
                episode_number: puzzle.episode_number,
                title: puzzle.episode_title,
            },
        };

        return NextResponse.json(response);
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


