# Year 5 Maths

A maths teaching app for UK Year 5 (ages 9 to 10). It installs to the iPad Home Screen and works offline.

Phase 0 is the shell: install guide, Home, Map of the 8 units, and Options with colour choices. Units 1 (Number and place value), 2 (Addition and subtraction), 3 (Multiplication and division), 4 (Fractions), 5 (Decimals and percentages), 6 (Measurement), 7 (Geometry) and 8 (Statistics) have worked examples and generated practice questions. Times tables practice (2 to 12 and mixed, with optional division facts and stopwatch) is reached from Home.

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
- `src/engine/written.ts` and `src/engine/pictures.ts` describe the pictures used in worked examples: written methods drawn as on paper, place value charts, number lines, bar models, dot arrays and hundred squares. Every step of every worked example must have a picture, and a test checks this.
- `src/inputs/` holds the number pad, choices, ordering cards, number line, column layout, short division layout, fraction boxes and fraction bars.
- `vite.config.ts` holds the web app manifest and offline settings.

Pushing to `main` builds and publishes the app with GitHub Pages.
