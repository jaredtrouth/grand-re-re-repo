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
  image_url TEXT,                   -- Episode image URL (scraped from wiki)
  wiki_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season, episode_number)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season);

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
  burger_id UUID REFERENCES burgers(id) NOT NULL
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
  burger_name TEXT,
  burger_description TEXT,
  store_next_door TEXT,
  pest_control TEXT,
  other_burgers TEXT,
  plot_summary TEXT,
  episode_season INT,
  episode_number INT,
  episode_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    puzzle_date::TEXT as puzzle_id,
    encode(sha256(e.id::TEXT::BYTEA), 'hex') as answer_hash,  -- Hash episode ID for validation
    b.name as burger_name,
    b.description as burger_description,
    COALESCE(e.store_next_door, 'Not featured this episode') as store_next_door,
    COALESCE(e.pest_control_truck, 'Not featured this episode') as pest_control,
    -- Get other burgers from the same episode (excluding current)
    (
      SELECT string_agg(ob.name, ', ')
      FROM burgers ob
      WHERE ob.episode_id = e.id AND ob.id != b.id
    ) as other_burgers,
    COALESCE(e.plot_summary, 'Plot summary not available') as plot_summary,
    e.season as episode_season,
    e.episode_number as episode_number,
    e.title as episode_title
  FROM daily_puzzles dp
  JOIN burgers b ON dp.burger_id = b.id
  JOIN episodes e ON b.episode_id = e.id
  WHERE dp.date = puzzle_date;
END;
$$ LANGUAGE plpgsql;
