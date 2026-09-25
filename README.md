# Compass 🧭

A quiz web app that tests how well you know the capitals of the world's 195 countries.

**Play it:** https://gnahoujc.github.io/Compass/

## Features

- **Two modes**: Country → Capital, or the reverse (Capital → Country)
- **Multiple choice** with 4 options; wrong options come from the same continent where possible
- **Continent filter**: quiz yourself on any combination of continents
- **Timer**: off, or 10 / 15 / 30 seconds per question (running out counts as wrong)
- **Best scores** saved in your browser, per combination of settings (ranked by correct answers, then speed)
- The country's flag is shown after each answer
- Review list of missed questions at the end
- **Invite-only sign-in** by email link (no passwords)
- **Online scoreboard**: pick a display name and compete for the top 10 on each combination of settings
- Keyboard shortcuts: `1`–`4` to answer, `Enter` for the next question (the quiz waits for you after each answer)
- Light and dark themes, works on phones

## Getting started

Requires Node.js 20+.

```sh
npm install
npm run dev       # start the dev server at http://localhost:5173
npm test          # run the tests
npm run build     # type-check and build to dist/
```

## Sign-in and scoreboard (Supabase)

Players must sign in before playing, with a one-time link sent by email. Only people you
invite can sign in. Scores are stored in [Supabase](https://supabase.com), linked to the
account that posted them. Only signed-in users can read the scoreboard or post, and only
as themselves.

### Supabase dashboard setup

1. **SQL Editor → New query**: paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   It is safe to run again. It deletes any scores that have no account attached.
2. **Authentication → Sign In / Providers**:
   - **Email** is enabled.
   - Turn **off** "Allow new users to sign up". Only invited users can then sign in.
   - Leave "Confirm email" on and **Anonymous sign-ins** off.
3. **Authentication → URL Configuration**:
   - **Site URL**: `https://gnahoujc.github.io/Compass/`
   - **Redirect URLs**: add `http://localhost:5173/**` and `https://gnahoujc.github.io/Compass/**`
4. **Email delivery**: Supabase's built-in email service only delivers to members of your
   Supabase organisation and allows very few emails per hour. To invite anyone else, set up
   your own email service (for example Resend or Brevo) under
   **Authentication → Emails → SMTP Settings**.
5. **Invite someone**: **Authentication → Users → Add user → Send invitation**. They click the
   link in the email and arrive signed in. After that they use "Email me a sign-in link" on
   the login screen.
6. **Remove someone**: delete them under **Authentication → Users**. Their scores are
   deleted too.

### App configuration

From **Project Settings → API**, take the project URL and the publishable (or anon) key:

- **Local development**: copy `.env.example` to `.env.local` and fill in both values.
- **Deployed site**: repository **variables** (not secrets) named `SUPABASE_URL` and `SUPABASE_KEY`.

The key is public by design; the database rules above decide what it can do.

## Continuous integration

Every pull request runs the tests and a production build (`.github/workflows/ci.yml`).

## Deployment

Every push to `main` runs the tests, builds the app and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`). It can also be run by hand from the repo's Actions tab.

## Project layout

```
src/
  data/countries.ts   country, capital and continent data
  lib/quiz.ts         question and answer-choice generation (pure functions)
  lib/scores.ts       best-score storage (localStorage)
  hooks/useTimer.ts   per-question countdown
  components/         Setup, Quiz and Results screens
  App.tsx             switches between the screens
```

Countries with more than one capital use a single canonical one; see the comment at the top of
`src/data/countries.ts`.
