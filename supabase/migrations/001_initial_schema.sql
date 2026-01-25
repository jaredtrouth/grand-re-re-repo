-- Burger of the Daydle Database Schema

-- =========================================
-- Episodes table (static show data)
-- =========================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season INT NOT NULL,
  episode_number INT NOT NULL,
  title TEXT NOT NULL,
  pest_control_truck TEXT,          -- Nullable for early seasons
  store_next_door TEXT,             -- Nullable for specials
  plot_summary TEXT,
  still_url TEXT,                   -- Episode image URL (scraped from wiki)
  wiki_url TEXT,
  original_air_date DATE,
  guest_stars TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season, episode_number)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season);

-- =========================================
-- Episode quotes (one episode can have multiple quotes)
-- =========================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  quote TEXT NOT NULL,
  speaker TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(episode_id, quote)
);

-- Index for querying quotes by episode
CREATE INDEX IF NOT EXISTS idx_quotes_episode ON quotes(episode_id);

-- =========================================
-- Burgers table (one episode can have multiple burgers)
-- =========================================
CREATE TABLE IF NOT EXISTS burgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,              -- "The Garden of Eden Burger"
  description TEXT,                -- "(comes with salad)" - optional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(episode_id, name)
);

-- Index for querying burgers by episode
CREATE INDEX IF NOT EXISTS idx_burgers_episode ON burgers(episode_id);

-- =========================================
-- Daily puzzles schedule (pre-filled)
-- =========================================
CREATE TABLE IF NOT EXISTS daily_puzzles (
  date DATE PRIMARY KEY,
  burger_id UUID REFERENCES burgers(id) NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  UNIQUE(burger_id, quote_id)
);

-- =========================================
-- Global game statistics
-- =========================================
CREATE TABLE IF NOT EXISTS game_stats (
  date DATE PRIMARY KEY REFERENCES daily_puzzles(date),
  win_on_guess_1 INT DEFAULT 0,
  win_on_guess_2 INT DEFAULT 0,
  win_on_guess_3 INT DEFAULT 0,
  win_on_guess_4 INT DEFAULT 0,
  win_on_guess_5 INT DEFAULT 0,
  win_on_guess_6 INT DEFAULT 0,
  losses INT DEFAULT 0
);

-- =========================================
-- RPC for atomic stat increments
-- =========================================
CREATE OR REPLACE FUNCTION increment_game_stat(
  puzzle_date DATE,
  guess_number INT  -- 0 = loss, 1-6 = win on that guess
)
RETURNS VOID AS $$
BEGIN
  -- Ensure row exists
  INSERT INTO game_stats (date) VALUES (puzzle_date)
  ON CONFLICT (date) DO NOTHING;
  
  -- Increment appropriate counter
  CASE guess_number
    WHEN 0 THEN UPDATE game_stats SET losses = losses + 1 WHERE date = puzzle_date;
    WHEN 1 THEN UPDATE game_stats SET win_on_guess_1 = win_on_guess_1 + 1 WHERE date = puzzle_date;
    WHEN 2 THEN UPDATE game_stats SET win_on_guess_2 = win_on_guess_2 + 1 WHERE date = puzzle_date;
    WHEN 3 THEN UPDATE game_stats SET win_on_guess_3 = win_on_guess_3 + 1 WHERE date = puzzle_date;
    WHEN 4 THEN UPDATE game_stats SET win_on_guess_4 = win_on_guess_4 + 1 WHERE date = puzzle_date;
    WHEN 5 THEN UPDATE game_stats SET win_on_guess_5 = win_on_guess_5 + 1 WHERE date = puzzle_date;
    WHEN 6 THEN UPDATE game_stats SET win_on_guess_6 = win_on_guess_6 + 1 WHERE date = puzzle_date;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- RPC to get daily puzzle with hints
-- =========================================
CREATE OR REPLACE FUNCTION get_daily_puzzle(puzzle_date DATE)
RETURNS TABLE (
  puzzle_id TEXT,
  answer_hash TEXT,
  burger JSONB,
  episode JSONB,
  quote JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.date::TEXT as puzzle_id,
    encode(sha256(dp.burger_id::TEXT::BYTEA), 'hex') as answer_hash,
    jsonb_build_object(
      'name', b.name,
      'description', b.description
    ) as burger,
    jsonb_build_object(
      'season', e.season,
      'episode_number', e.episode_number,
      'title', e.title,
      'store_next_door', e.store_next_door,
      'pest_control', e.pest_control_truck,
      'plot_summary', e.plot_summary,
      'still_url', e.still_url,
      'original_air_date', e.original_air_date,
      'guest_stars', e.guest_stars
    ) as episode,
    jsonb_build_object(
      'quote_text', q.quote,
      'speaker', q.speaker,
      'location', q.location
    ) as quote
  FROM daily_puzzles dp
  JOIN burgers b ON dp.burger_id = b.id
  JOIN episodes e ON b.episode_id = e.id
  LEFT JOIN quotes q ON dp.quote_id = q.id
  WHERE dp.date = puzzle_date;
END;
$$ LANGUAGE plpgsql;
