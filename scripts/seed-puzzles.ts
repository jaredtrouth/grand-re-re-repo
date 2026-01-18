/**
 * Puzzle Seeder
 * 
 * Shuffles all burgers from the database and assigns them to sequential dates.
 * Run AFTER scrape-wiki.ts to populate the burgers table.
 * 
 * Usage: node scripts/seed-puzzles.ts [start-date]
 * Example: node scripts/seed-puzzles.ts 2026-01-20
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/supabase';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🎲 Puzzle Seeder');
console.log('====================================\n');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Add days to a date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

async function main() {
    // Get start date from command line or use today
    const startDateArg = process.argv[2];
    const startDate = startDateArg ? new Date(startDateArg) : new Date();

    console.log(`Start date: ${formatDate(startDate)}\n`);

    // Fetch all burgers with their episode info
    console.log('Fetching burgers...');
    const { data: burgers, error: fetchError } = await supabase
        .from('burgers')
        .select(`
      id,
      name,
      episodes (
        season,
        episode_number,
        title
      )
    `);

    if (fetchError) {
        console.error('❌ Failed to fetch burgers:', fetchError.message);
        process.exit(1);
    }

    if (!burgers || burgers.length === 0) {
        console.error('❌ No burgers found. Run scrape-wiki.ts first.');
        process.exit(1);
    }

    console.log(`Found ${burgers.length} burgers.\n`);

    // Shuffle burgers
    console.log('Shuffling burgers...');
    const shuffled = shuffle(burgers);

    // Create puzzle schedule
    const puzzles = shuffled.map((burger, i) => ({
        date: formatDate(addDays(startDate, i)),
        burger_id: burger.id,
    }));

    // Preview
    console.log('\nPreview (first 5):');
    puzzles.slice(0, 5).forEach((p, i) => {
        const burger = shuffled[i];
        const ep = burger.episodes as { season: number; episode_number: number; title: string } | null;
        const epCode = ep ? `S${String(ep.season).padStart(2, '0')}E${String(ep.episode_number).padStart(2, '0')}` : 'Unknown';
        console.log(`  ${p.date}: 🍔 ${burger.name}`);
        console.log(`           └─ ${epCode} - ${ep?.title || 'Unknown'}`);
    });

    // Insert
    console.log('\nInserting puzzles...');
    const { error: insertError } = await supabase
        .from('daily_puzzles')
        .upsert(puzzles, { onConflict: 'date' });

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message);
        process.exit(1);
    }

    console.log(`\n✓ Scheduled ${puzzles.length} burger puzzles`);
    console.log(`  From: ${puzzles[0].date}`);
    console.log(`  To:   ${puzzles[puzzles.length - 1].date}`);
}

main().catch(console.error);
