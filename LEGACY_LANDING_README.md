# CareerFlow AI — Cinematic Landing Page

A complete zero-dependency, browser-rendered landing page for CareerFlow AI.

## What's included

- `index.html`: semantic page with hero, four career intelligence engines, interactive role-signal section, concept stats, native FAQ, conversion closing, and an accessible interactive preview dialog.
- `styles.css`: near-black/indigo design system, responsive 4→2→1 grids, motion policies, keyboard focus, visual detail.
- `main.js`: WebGL sine-ribbon shader with 2D fallback; staged intro/glyph rise; four independent canvas visualizations; intersection-gated 72-bar career-alignment signal; role selector; interactive preview and mobile nav.

The page generates all artwork in the browser—no photos, SVG packages, or bitmap files. Inter and JetBrains Mono load from Google Fonts when available, with system fallbacks when offline.

## Run locally

Open `index.html` in Chrome/Edge, or for consistent local behavior run:

```powershell
cd CareerFlow-AI-Landing
python -m http.server 5173
```

Then open `http://localhost:5173`. There are no install steps or required environment variables.

## Deploy (only with your approval)

Upload these three files to a static host, or set Netlify publish directory to this folder. No build command is needed. This project has **not** been deployed or published.

## Honesty and production notes

- The career-alignment spectrum and preview score are **illustrative**, not connected to real jobs or AI APIs.
- The site is an interactive landing-page concept, not a completed CareerFlow SaaS backend.
- All action buttons work: the primary CTA opens a real client-side preview, navigation scrolls to actual sections, role tabs change the chart, FAQ expands, and mobile navigation opens and closes.
- The design intentionally avoids fabricated customer testimonials, user counts, results, or employer logos.
- No information is collected, transmitted, or stored. A genuine waiting list or signup requires an explicit backend, privacy policy, consent notice, verified email, and approved deployment.
- `prefers-reduced-motion` disables the intro and running animations, preserving all static content.
- Before launch: configure a real signup/payment backend, add legal pages, finalize copy and domain, complete security/accessibility testing, and verify business readiness.

## Next integration

Move the content into the CareerFlow AI React/Vite repository as dedicated page components. Keep the three canvas renderers isolated in hooks or modules, and clean up listeners/RAF loops on unmount. Match the same design tokens in your shared UI system.

