import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/adminAuth';

// GET /api/admin/puzzles - Get scheduled puzzles for date range
export async function GET(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
        return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 });
    }

    try {
        const supabase = createServerClient();

        const { data: puzzles, error } = await supabase
            .from('daily_puzzles')
            .select(`
        date,
        burger_id,
        burgers (
          name,
          episode_id,
          episodes (
            title,
            season,
            episode_number
          )
        )
      `)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: true });

        if (error) {
            console.error('Error fetching puzzles:', error);
            return NextResponse.json({ error: 'Failed to fetch puzzles' }, { status: 500 });
        }

        // Flatten the nested data
        const formattedPuzzles = puzzles?.map((p) => {
            const burger = p.burgers as unknown as {
                name: string;
                episode_id: string;
                episodes: { title: string; season: number; episode_number: number };
            };
            return {
                date: p.date,
                burger_id: p.burger_id,
                burger_name: burger?.name,
                episode_title: burger?.episodes?.title,
                season: burger?.episodes?.season,
                episode_number: burger?.episodes?.episode_number,
            };
        });

        return NextResponse.json({ puzzles: formattedPuzzles });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/puzzles - Schedule a puzzle
export async function POST(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { date, burger_id } = body;

        if (!date || !burger_id) {
            return NextResponse.json({ error: 'Date and burger_id required' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Upsert the puzzle (allows updating existing)
        const { error } = await supabase
            .from('daily_puzzles')
            .upsert({
                date,
                burger_id,
            }, {
                onConflict: 'date',
            });

        if (error) {
            console.error('Error scheduling puzzle:', error);
            return NextResponse.json({ error: 'Failed to schedule puzzle' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/admin/puzzles - Remove a scheduled puzzle
export async function DELETE(request: NextRequest) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { date } = body;

        if (!date) {
            return NextResponse.json({ error: 'Date required' }, { status: 400 });
        }

        const supabase = createServerClient();

        const { error } = await supabase
            .from('daily_puzzles')
            .delete()
            .eq('date', date);

        if (error) {
            console.error('Error deleting puzzle:', error);
            return NextResponse.json({ error: 'Failed to delete puzzle' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
