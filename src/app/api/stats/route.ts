import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET /api/stats?date=YYYY-MM-DD - Get global stats for a puzzle
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('game_stats')
            .select('*')
            .eq('date', date)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Error fetching stats:', error);
            return NextResponse.json(
                { error: 'Failed to fetch stats' },
                { status: 500 }
            );
        }

        // Calculate total plays
        const stats = data || {
            date,
            win_on_guess_1: 0,
            win_on_guess_2: 0,
            win_on_guess_3: 0,
            win_on_guess_4: 0,
            win_on_guess_5: 0,
            win_on_guess_6: 0,
            losses: 0,
        };

        const total_plays =
            (stats.win_on_guess_1 ?? 0) +
            (stats.win_on_guess_2 ?? 0) +
            (stats.win_on_guess_3 ?? 0) +
            (stats.win_on_guess_4 ?? 0) +
            (stats.win_on_guess_5 ?? 0) +
            (stats.win_on_guess_6 ?? 0) +
            (stats.losses ?? 0);

        return NextResponse.json({ ...stats, total_plays });
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/stats - Submit game result for global stats
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { date, guess_number } = body;

        if (!date || guess_number === undefined) {
            return NextResponse.json(
                { error: 'Date and guess_number are required' },
                { status: 400 }
            );
        }

        // Validate guess_number (0 = loss, 1-6 = win)
        if (guess_number < 0 || guess_number > 6) {
            return NextResponse.json(
                { error: 'guess_number must be between 0 and 6' },
                { status: 400 }
            );
        }

        const supabase = createServerClient();

        // Call RPC to atomically increment stat
        const { error } = await supabase
            .rpc('increment_game_stat', {
                puzzle_date: date,
                guess_number: guess_number
            });

        if (error) {
            console.error('Error updating stats:', error);
            return NextResponse.json(
                { error: 'Failed to update stats' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
