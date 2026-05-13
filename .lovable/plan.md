## WasteTrack AI — Investor Pitch Deck (PDF)

Deliverable: a single 16:9 cinematic PDF saved to `/mnt/documents/WasteTrack_AI_Pitch_Deck.pdf`, ~20 slides, dark futuristic smart-city aesthetic, investor-grade.

### Visual system
- 16:9 (1920x1080 per page), dark navy/black base (`#05070D`, `#0A1220`)
- Teal/emerald neon accents (`#10E0B0`, `#34D399`) matching the app brand
- Premium typography: Space Grotesk (headlines) + Inter (body) + JetBrains Mono (data labels)
- Recurring motifs: thin neon dividers, glowing stat cards, grid backgrounds, soft radial glows, monospace metric labels
- Every slide has a slide number, section tag, and subtle WasteTrack AI watermark

### Visuals strategy (mix)
- **Real app screenshots** for product demo slides — captured via browser tools from `/dashboard`, `/admin`, `/cleaner-dashboard`, `/report`, `/performance`. Composited into glowing device frames.
- **AI-generated cinematic visuals** for: hero cover, smart city skyline, IoT smart bin renders, waste-to-energy, AI control center, environmental impact, vision closer.
- **Programmatic diagrams** (drawn in reportlab/SVG) for: hardware architecture (ESP32 + sensors), system workflow, AI automation layer, business model canvas, roadmap timeline, market sizing, competitive matrix, traction charts.

### Slide list (20)
1. Cover — hero smart-city visual + tagline
2. The Problem — pollution emotional spread + 4 stat cards
3. Existing System Failures — 4-quadrant pain grid
4. Our Solution — AI + IoT + Automation + Community pillars
5. Product Demo I — Citizen/Student dashboard screenshot
6. Product Demo II — Cleaner dashboard + live route
7. Product Demo III — Admin analytics dashboard
8. Reporting Flow — 5-step visual journey with screenshots
9. Hardware Layer — smart bin render + sensor callouts
10. Hardware Architecture — ESP32 data-flow diagram
11. How It Works — end-to-end system workflow
12. AI & Automation Layer — predictive intelligence visual
13. Waste-to-Value — circular economy diagram
14. Market Opportunity — TAM/SAM/SOM + Africa map
15. Business Model — 5 revenue streams
16. Competitive Advantage — comparison matrix
17. Traction & Progress — milestone timeline + metrics
18. Impact Metrics — environmental/social KPIs
19. Roadmap — 4-phase horizon
20. Team — founder/engineering layout
21. Funding Ask — use-of-funds breakdown
22. Vision Closer — cinematic full-bleed final statement

(22 slides total — covers everything in your structure.)

### Build steps
1. Capture 5 real dashboard screenshots from the live preview via browser tools at 1440x900.
2. Generate ~8 cinematic AI visuals (cover, smart city, smart bin, IoT close-up, AI control center, waste-to-energy, environmental impact, vision closer) at 1920x1080.
3. Write a Python builder using reportlab Canvas (full pixel control for cinematic layouts) — modular slide functions with shared theme tokens, glow shapes, neon dividers, stat cards, and programmatic diagrams.
4. Render to `/mnt/documents/WasteTrack_AI_Pitch_Deck.pdf`.
5. Mandatory QA: convert every page to JPG with `pdftoppm`, inspect each one for overflow/contrast/alignment issues, fix and re-render until clean.
6. Emit a `<presentation-artifact>` tag for download.

### Notes
- No project source files will be modified — this is a pure artifact build.
- Versioned filenames (`_v2`, `_v3`) on iterations.
- If a real screenshot fails to capture (auth wall, etc.), fall back to a styled AI mockup so no slide is left blank.
