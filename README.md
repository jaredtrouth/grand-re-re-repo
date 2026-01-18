# Burger of the Day-dle 🍔

A daily guessing game for **Bob's Burgers** fans. Guess the episode based on the "Burger of the Day", the store next door, and the pest control truck. Puzzles are generated from data scraped from the [Bob's Burgers Wiki](https://bobs-burgers.fandom.com/).

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/)
- **State Management**: React Hooks & Local Storage
- **Scraping**: Cheerio

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/grand-re-re-repo.git
    cd grand-re-re-repo
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Copy the example environment file:
    ```bash
    cp .env.local.example .env.local
    ```
    Update `.env.local` with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts & Tools

### Scraper
This project includes a script to populate your database with episode data from the wiki.

```bash
# Scrape episodes (Dry run)
npx tsx scripts/scrape-wiki.ts --dry-run

# Scrape episodes and write to DB
npx tsx scripts/scrape-wiki.ts

# Limit the number of episodes scraped
npx tsx scripts/scrape-wiki.ts --limit 10
```

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: React components (UI, Modals, Game Logic).
- `src/hooks`: Custom hooks (Game State, etc).
- `src/types`: TypeScript definitions.
- `scripts`: Utility scripts for data scraping and maintenance.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
