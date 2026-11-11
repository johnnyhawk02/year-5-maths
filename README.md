# Year 5 Maths

A maths teaching app for UK Year 5 (ages 9 to 10). It installs to the iPad Home Screen and works offline.

Phase 0 is the shell: install guide, Home, Map of the 8 units, and Options with colour choices. Units 1 (Number and place value) and 2 (Addition and subtraction) have worked examples and generated practice questions.

## Develop

```
npm install
npm run dev       # local dev server
npm run build     # type check and build to dist/
npm run preview   # serve the built app, including the service worker
npm run icons     # redraw the app icons
npm test          # check every question generator
```

## Layout

- `src/theme.ts` holds the colour choices and saved settings.
- `src/curriculum.ts` holds the units and skills.
- `src/screens/` holds one file per screen.
- `src/skills/` holds the worked examples and question generators, one file per unit.
- `src/engine/` holds the question types, number formatting and the seeded random numbers.
- `src/inputs/` holds the number pad, choices, ordering cards, number line and column layout.
- `vite.config.ts` holds the web app manifest and offline settings.

Pushing to `main` builds and publishes the app with GitHub Pages.
