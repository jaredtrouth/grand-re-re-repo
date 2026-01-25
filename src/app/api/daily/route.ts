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
        const response: DailyPuzzle = JSON.parse(JSON.stringify(puzzle));

        return NextResponse.json(response);
    } catch (e) {
        console.error('Unexpected error:', e);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


