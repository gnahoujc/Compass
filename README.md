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
- Keyboard shortcuts: `1`–`4` to answer, `Enter` to skip to the next question
- Light and dark themes, works on phones

## Getting started

Requires Node.js 20+.

```sh
npm install
npm run dev       # start the dev server at http://localhost:5173
npm test          # run the tests
npm run build     # type-check and build to dist/
```

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
