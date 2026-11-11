# Year 5 Maths

A maths teaching app for UK Year 5 (ages 9 to 10). It installs to the iPad Home Screen and works offline.

Phase 0 is the shell: install guide, Home, Map of the 8 units, and Options with colour choices. Lessons arrive from phase 1.

## Develop

```
npm install
npm run dev       # local dev server
npm run build     # type check and build to dist/
npm run preview   # serve the built app, including the service worker
npm run icons     # redraw the app icons
```

## Layout

- `src/theme.ts` holds the colour choices and saved settings.
- `src/curriculum.ts` holds the units and skills.
- `src/screens/` holds one file per screen.
- `vite.config.ts` holds the web app manifest and offline settings.

Pushing to `main` builds and publishes the app with GitHub Pages.
