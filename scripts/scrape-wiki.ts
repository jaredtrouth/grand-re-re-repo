/**
 * Bob's Burgers Wiki Scraper
 * 
 * Scrapes each episode's /Gags subpage for store, truck, and burger data.
 * Gets episode list from the Episode Guide page.
 * 
 * Usage: node scripts/scrape-wiki.ts [--limit N] [--dry-run]
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import type { Database } from '../src/types/supabase';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const WIKI_BASE = 'https://bobs-burgers.fandom.com';
const EPISODE_GUIDE = `${WIKI_BASE}/wiki/Episode_Guide`;
const RATE_LIMIT_MS = 300;

// Parse command line args
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : Infinity;
const DRY_RUN = args.includes('--dry-run');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🍔 Bob\'s Burgers Wiki Scraper');
console.log('=============================================\n');

if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No database writes\n');
}

let supabase: ReturnType<typeof createClient<Database>> | null = null;

if (!DRY_RUN) {
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        process.exit(1);
    }
    supabase = createClient<Database>(supabaseUrl, supabaseKey);
}

interface Episode {
    title: string;
    url: string;
    season: number;
    episodeNumber: number;
}

interface GagsData {
    store_next_door: string | null;
    pest_control_truck: string | null;
    burgers: { name: string; description: string | null }[];
}

interface EpisodeData {
    plot_summary: string | null;
    image_url: string | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPage(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: { 'User-Agent': 'BurgerDaydle-Bot/1.0 (burgerofthe.day)' },
    });
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return response.text();
}

// Get list of all episodes from Episode Guide page
async function scrapeEpisodeList(): Promise<Episode[]> {
    console.log('📋 Fetching Episode Guide...');
    const html = await fetchPage(EPISODE_GUIDE);
    const $ = cheerio.load(html);

    const episodes: Episode[] = [];
    let currentSeason = 0;
    let episodeInSeason = 0;
    const seenUrls = new Set<string>();

    // Target the specific season tables using the class identified by inspection
    $('table.wiki.fries-background').each((_, table) => {
        const $table = $(table);

        // Try to find the season number from the preceding header
        let $prev = $table.prev();
        while ($prev.length && !$prev.is('h2') && !$prev.is('h3')) {
            $prev = $prev.prev();
        }

        if ($prev.length) {
            const seasonMatch = $prev.text().match(/Season\s*(\d+)/i);
            if (seasonMatch) {
                currentSeason = parseInt(seasonMatch[1], 10);
                episodeInSeason = 0;
                console.log(`  📺 Season ${currentSeason}`);
            }
        }

        if (currentSeason === 0) return;

        // Iterate through rows
        $table.find('tr').each((_, row) => {
            const cells = $(row).find('td');

            // Episode rows have multiple cells (usually 7). Summary rows have 1 spanning cell.
            if (cells.length < 3) return;

            const titleCell = $(cells[1]);
            const link = titleCell.find('a[href^="/wiki/"]').first();
            const href = link.attr('href');

            if (!href || href.includes(':') || href.includes('Season')) return;

            const title = link.text().trim().replace(/^["']|["']$/g, '');
            if (title.length < 2) return;

            if (seenUrls.has(href)) return;
            seenUrls.add(href);

            episodeInSeason++;
            episodes.push({
                title: title,
                url: `${WIKI_BASE}${href}`,
                season: currentSeason,
                episodeNumber: episodeInSeason,
            });
        });
    });

    console.log(`\n✓ Found ${episodes.length} episodes across ${currentSeason} seasons\n`);
    return episodes;
}

// Scrape the Gags subpage for an episode
async function scrapeGagsPage(episodeUrl: string, episodeTitle: string): Promise<GagsData> {
    const gagsUrl = `${episodeUrl}/Gags`;
    const data: GagsData = {
        store_next_door: null,
        pest_control_truck: null,
        burgers: [],
    };
    const fallbackItems: string[] = [];

    // Helper to filter and add burgers
    const processBurgerData = (data: GagsData, burgerText: string) => {
        // More careful cleanup to preserve hyphens in names
        // Only split on " - " or " – " (en dash) or start of parenthesis
        let name = burgerText.replace(/^["''"]+|["''"]+$/g, '').trim();
        let description: string | null = null;

        // Try to find description separator
        const separatorMatch = name.match(/\s+[-–—]\s+/);
        if (separatorMatch) {
            description = name.substring(separatorMatch.index! + separatorMatch[0].length).trim();
            name = name.substring(0, separatorMatch.index).trim();
        } else {
            // Check for description in parentheses if no dash separator
            const parenMatch = name.match(/^(.+?)\s*\(([^)]+)\)$/);
            if (parenMatch) {
                name = parenMatch[1].trim();
                description = `(${parenMatch[2].trim()})`;
            }
        }

        // Final cleanup of name
        name = name.replace(/^["''"]+|["''"]+$/g, '').trim();

        // Skip garbage entries
        if (
            name.length < 3 ||
            name.toLowerCase().includes('burger of the day') ||
            /^(bob|gene|tina|linda|louise):?$/i.test(name) ||
            name.toLowerCase() === 'none' ||
            name.toLowerCase().includes('there are no burgers') ||
            name.toLowerCase().includes('prices') ||
            name.toLowerCase() === 'running gags' ||
            name.toLowerCase() === episodeTitle.toLowerCase() ||
            name.toLowerCase().includes('end credits sequence')
        ) {
            return;
        }

        // Add parentheses to description if missing
        if (description && !description.startsWith('(') && !description.endsWith(')')) {
            description = `(${description})`;
        }

        // Avoid duplicates
        if (!data.burgers.some(b => b.name === name)) {
            data.burgers.push({ name, description });
        }
    };

    try {
        const html = await fetchPage(gagsUrl);
        const $ = cheerio.load(html);

        // Find each section by looking for headlines
        const content = $('#mw-content-text');

        // Process each section
        content.find('h2, h3').each((_, heading) => {
            const $heading = $(heading);
            const headingText = $heading.text().toLowerCase();

            // Collect all content elements between this heading and the next
            let $next = $heading.next();
            const sectionElements: cheerio.Cheerio<any>[] = [];

            while ($next.length && !$next.is('h2') && !$next.is('h3')) {
                sectionElements.push($next);
                $next = $next.next();
            }

            // Helper to extract relevant text from a set of elements
            const extractText = (elements: cheerio.Cheerio<any>[]) => {
                const results: string[] = [];

                // Create a wrapper to query inside
                const wrapper = cheerio.load('<div></div>')('div');
                elements.forEach(el => wrapper.append(el.clone()));

                // Find all bold text
                wrapper.find('b, strong').each((_, bold) => {
                    const text = $(bold).text().trim();
                    if (text.length > 2) {
                        results.push(text);
                    }
                });

                return results;
            };

            const sectionContent = extractText(sectionElements);

            // Capture "Running Gags" section (H2) as a catch-all backup
            if ((headingText.includes('running gags') || headingText === 'gags') && sectionContent.length > 0) {
                fallbackItems.push(...sectionContent);
            }

            // Assign to appropriate field based on heading
            if (headingText.includes('store next door') && sectionContent.length > 0) {
                // Take first non-generic value
                const storeName = sectionContent.find(s =>
                    !s.toLowerCase().includes('store next door') &&
                    s.length > 2
                );
                if (storeName) {
                    data.store_next_door = storeName;
                }
            } else if (headingText.includes('pest control') && sectionContent.length > 0) {
                const truckName = sectionContent.find(s =>
                    !s.toLowerCase().includes('pest control truck') &&
                    s.length > 2
                );
                if (truckName) {
                    data.pest_control_truck = truckName;
                }
            } else if (headingText.includes('burger of the day')) {
                // Filter out generic names and garbage
                for (const burgerText of sectionContent) {
                    processBurgerData(data, burgerText);
                }
            }
        });

        // FALLBACK: If no burgers found via specific section, try to extract from the main "Running Gags" list
        if (data.burgers.length === 0 && fallbackItems.length > 0) {
            for (const item of fallbackItems) {
                // Filter out known store/truck
                if (data.store_next_door && item === data.store_next_door) continue;
                if (data.pest_control_truck && item === data.pest_control_truck) continue;

                processBurgerData(data, item);
            }
        }

    } catch (e) {
        // Gags page might not exist for some episodes
    }

    return data;
}

// Scrape main episode page for plot and image
async function scrapeEpisodePage(url: string): Promise<EpisodeData> {
    try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);

        const data: EpisodeData = {
            plot_summary: null,
            image_url: null,
        };

        // Get image from infobox
        const infobox = $('.portable-infobox, .infobox');
        const image = infobox.find('img').first();
        if (image.length) {
            let imgSrc = image.attr('src') || '';
            imgSrc = imgSrc.split('/revision/')[0];
            if (imgSrc && !imgSrc.includes('placeholder') && !imgSrc.includes('data:')) {
                data.image_url = imgSrc;
            }
        }

        // Get plot summary
        let plotText = '';
        const plotHeader = $('h2 .mw-headline:contains("Plot")').first();
        if (plotHeader.length) {
            const nextPara = plotHeader.closest('h2').nextAll('p').first();
            plotText = nextPara.text().trim();
        }
        if (!plotText) {
            const firstPara = $('#mw-content-text .mw-parser-output > p').first();
            plotText = firstPara.text().trim();
        }
        if (plotText && plotText.length > 30) {
            data.plot_summary = plotText.replace(/\[\d+\]/g, '').substring(0, 500).trim();
        }

        return data;
    } catch (e) {
        console.error(`    ⚠️ Failed to scrape ${url}`);
        return { plot_summary: null, image_url: null };
    }
}

// Main function
async function main() {
    // Test database connection
    if (!DRY_RUN && supabase) {
        try {
            const { error } = await supabase.from('episodes').select('id').limit(1);
            if (error) {
                console.error('❌ Database error:', error.message);
                process.exit(1);
            }
            console.log('✓ Database connected\n');
        } catch (e) {
            console.error('❌ Connection failed:', e);
            console.error('   Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
            process.exit(1);
        }
    }

    // Step 1: Get episode list
    const allEpisodes = await scrapeEpisodeList();
    const episodes = LIMIT < Infinity ? allEpisodes.slice(0, LIMIT) : allEpisodes;

    if (LIMIT < Infinity) {
        console.log(`📌 Limited to ${LIMIT} episodes for testing\n`);
    }

    // Step 2: Scrape each episode's Gags page and main page
    console.log(`📺 Scraping ${episodes.length} episodes...\n`);

    const results: Array<{
        episode: Episode;
        gags: GagsData;
        details: EpisodeData;
    }> = [];

    for (let i = 0; i < episodes.length; i++) {
        const episode = episodes[i];
        console.log(`  ${i + 1}/${episodes.length}: S${String(episode.season).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')} ${episode.title}`);

        // Fetch gags page
        const gags = await scrapeGagsPage(episode.url, episode.title);
        await sleep(RATE_LIMIT_MS);

        // Fetch main episode page for plot/image
        const details = await scrapeEpisodePage(episode.url);
        await sleep(RATE_LIMIT_MS);

        results.push({ episode, gags, details });
    }

    // Step 3: Output or insert
    if (DRY_RUN) {
        console.log('\n📋 Would insert:\n');
        let burgerCount = 0;
        for (const { episode, gags, details } of results) {
            console.log(`  S${String(episode.season).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}: ${episode.title}`);
            if (details.plot_summary) {
                console.log(`    📝 ${details.plot_summary.substring(0, 60)}...`);
            }
            if (gags.store_next_door) {
                console.log(`    🏪 Store: ${gags.store_next_door}`);
            }
            if (gags.pest_control_truck) {
                console.log(`    🚐 Truck: ${gags.pest_control_truck}`);
            }
            for (const b of gags.burgers) {
                console.log(`    🍔 ${b.name}${b.description ? ' ' + b.description : ''}`);
                burgerCount++;
            }
        }
        console.log(`\n✓ Total: ${results.length} episodes, ${burgerCount} burgers`);
        return;
    }

    // Insert into database
    if (!supabase) {
        console.error('No database connection');
        return;
    }

    console.log('\n💾 Inserting into database...\n');

    let epSuccess = 0;
    let burgerSuccess = 0; // This will now count new/updated burgers

    for (const { episode, gags, details } of results) {
        // 4. Upsert Episode
        const episodeData = {
            season: episode.season,
            episode_number: episode.episodeNumber,
            title: episode.title,
            wiki_url: episode.url,
            plot_summary: details.plot_summary,
            image_url: details.image_url,
            store_next_door: gags.store_next_door,
            pest_control_truck: gags.pest_control_truck,
        };

        const { data: epData, error: epError } = await supabase
            .from('episodes')
            .upsert(episodeData, { onConflict: 'season,episode_number' })
            .select('id')
            .single();

        if (epError || !epData) {
            console.error(`  ❌ S${episode.season}E${episode.episodeNumber}: Failed to upsert episode: ${epError?.message}`);
            continue;
        }

        epSuccess++;
        console.log(`  ✓ S${String(episode.season).padStart(2, '0')}E${String(episode.episodeNumber).padStart(2, '0')}: ${episode.title}`);


        // 5. Upsert Burgers
        if (gags.burgers.length > 0) {
            for (const burger of gags.burgers) {
                const { error: burgerError } = await supabase.from('burgers').upsert(
                    {
                        episode_id: epData.id,
                        name: burger.name,
                        description: burger.description,
                    },
                    { onConflict: 'episode_id,name' }
                );

                if (burgerError) {
                    console.error(`    ❌ ${burger.name}: ${burgerError.message}`);
                } else {
                    burgerSuccess++;
                    console.log(`    🍔 ${burger.name}`);
                }
            }
        } else {
            console.log('    (No burgers found)');
        }
    }

    console.log('\n=============================================');
    console.log(`✓ Episodes: ${epSuccess}`);
    console.log(`✓ Burgers: ${burgerSuccess}`);
    console.log('=============================================');

    if (burgerSuccess > 0) {
        console.log('\n📝 Next: node scripts/seed-puzzles.ts');
    }
}

main().catch(e => {
    console.error('\n❌ Fatal error:', e);
    process.exit(1);
});
