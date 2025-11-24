# Focus CTDP Tracker

A high-performance focus tracker based on Chained Time-Delay Protocol with visual analytics.

## How to Run Locally

1.  **Install Node.js**: Ensure you have Node.js installed on your computer.
2.  **Install Dependencies**: Run the following command in the project root:
    ```bash
    npm install
    ```
3.  **Setup Environment**:
    *   Create a file named `.env` in the root folder.
    *   Add your Supabase keys (see Database Setup below).
4.  **Start Development Server**:
    ```bash
    npm run dev
    ```
5.  **Open in Browser**: Click the link shown in the terminal (usually `http://localhost:5173`).

## Database Setup (Supabase)

To enable Cloud Sync, you need a free Supabase project.

1.  **Create Project**: Go to [database.new](https://database.new) and create a project.
2.  **Run SQL**: In the SQL Editor of your Supabase dashboard, run this script to create the table and security policies:

    ```sql
    -- Create Table (if not exists)
    create table if not exists user_data (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users not null,
      content jsonb not null,
      updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
      unique(user_id)
    );

    -- Enable Security
    alter table user_data enable row level security;

    -- Create Policy (Safely)
    drop policy if exists "Users can manage their own data" on user_data;
    create policy "Users can manage their own data" 
    on user_data 
    for all 
    using (auth.uid() = user_id);
    ```

3.  **Get API Keys**:
    *   Go to **Project Settings** -> **API**.
    *   Copy `Project URL` and `anon` `public` key.
4.  **Configure Local App**:
    *   Paste the keys into your `.env` file:
        ```
        VITE_SUPABASE_URL=https://your-project.supabase.co
        VITE_SUPABASE_ANON_KEY=your-key-here
        ```
5.  **Auth Config**:
    *   In Supabase **Authentication** -> **URL Configuration**, add `http://localhost:5173` to **Site URL** and **Redirect URLs** to ensure login links work locally.

## Technologies

*   React
*   TypeScript
*   Tailwind CSS (via CDN for portability)
*   Vite
*   Supabase (Auth & Database)
