import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/adminAuth';

// GET /api/admin/episodes - List all episodes with optional search/filter
export async function GET(request: NextRequest) {
    // Verify admin session
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const season = searchParams.get('season');

    try {
        const supabase = createServerClient();

        // Fetch episodes
        let episodeQuery = supabase
            .from('episodes')
            .select('*')
            .order('season', { ascending: true })
            .order('episode_number', { ascending: true });

        if (season) {
            episodeQuery = episodeQuery.eq('season', parseInt(season));
        }

        if (search) {
            episodeQuery = episodeQuery.ilike('title', `%${search}%`);
        }

        const { data: episodes, error: episodesError } = await episodeQuery;

        if (episodesError) {
            console.error('Error fetching episodes:', episodesError);
            return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
        }

        // Fetch all burgers
        const { data: burgers, error: burgersError } = await supabase
            .from('burgers')
            .select('*');

        if (burgersError) {
            console.error('Error fetching burgers:', burgersError);
            return NextResponse.json({ error: 'Failed to fetch burgers' }, { status: 500 });
        }

        return NextResponse.json({ episodes, burgers });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/admin/episodes - Update episode data
export async function PUT(request: NextRequest) {
    // Verify admin session
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { episodeId, episode, burgers } = body;

        if (!episodeId) {
            return NextResponse.json({ error: 'Episode ID required' }, { status: 400 });
        }

        const supabase = createServerClient();

        // Update episode
        const { error: episodeError } = await supabase
            .from('episodes')
            .update({
                quote_text: episode.quote_text || null,
                quote_speaker: episode.quote_speaker || null,
                quote_location: episode.quote_location || null,
                still_url: episode.still_url || null,
                store_next_door: episode.store_next_door || null,
                pest_control_truck: episode.pest_control_truck || null,
                original_air_date: episode.original_air_date || null,
                guest_stars: episode.guest_stars || null,
            })
            .eq('id', episodeId);

        if (episodeError) {
            console.error('Error updating episode:', episodeError);
            return NextResponse.json({ error: 'Failed to update episode' }, { status: 500 });
        }

        // Update/insert burgers
        if (burgers && burgers.length > 0) {
            for (const burger of burgers) {
                if (burger.id) {
                    // Update existing burger
                    const { error } = await supabase
                        .from('burgers')
                        .update({
                            name: burger.name,
                            description: burger.description || null,
                        })
                        .eq('id', burger.id);

                    if (error) {
                        console.error('Error updating burger:', error);
                    }
                } else {
                    // Insert new burger
                    const { error } = await supabase
                        .from('burgers')
                        .insert({
                            name: burger.name,
                            description: burger.description || null,
                            episode_id: episodeId,
                        });

                    if (error) {
                        console.error('Error inserting burger:', error);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
