# Canopy: retrospectives

A running record of what went well, what didn't and what to change. Newest first. Each retro covers the releases since the last one; the detail of every change is in [CHANGELOG.md](CHANGELOG.md).

## 2026-10-04 · From the first commit to v1.4

**Covers:** the foundations and live map (Sep 30), v1.0 and v1.1 (Oct 3), v1.2, v1.3 and v1.4 (Oct 4).

### What we could have done better

- **Check the live site, not only the local preview.** The Data sources page first shipped at `/data`, which collided with the folder of data files on the published site, and was only caught after the merge (#113). The misplaced filter menus and the desktop panel keeping its scroll position both went out in v1.3 and were found by use, not by checks (#116).
- **Review visual work in bulk.** The place islands took four rounds of feedback. Each round a handful of the 62 were inspected, and the waterfalls were visibly broken in one of them. A contact sheet of every island before review would have saved a round or two.
- **Decide the look before building around it.** The accent went from red to orange, the view switch from floating to the header, and the landing page from chips to lists and back to chips. Each change was cheap, but a quick mock of the bigger ones would have been cheaper.
- **Accessibility came last.** The audit ran at v1.3, after the orange brand color was chosen, which is why white text on the primary button still fails contrast (#63).
- **Releases were too close together.** Five versions in two days means the version numbers mark work sessions more than tested milestones.
- **No automated tests.** Quality rests on type-checking, lint, the build and manual checks. The rules for switching views are now intricate enough to break quietly.

### What we handled well

- **Small pull requests with a written before, after and why.** The changelog is detailed enough for someone picking the project up cold.
- **Review sheets.** Separate pages for map looks and for the islands, with a note per item, were the most efficient feedback loop.
- **Performance held as a priority.** Pre-drawn covers, a map engine that loads on demand, and cover-drawing code that loads only when needed all came from the rule that the app must stay fast and smooth.
- **Real data over invented data.** Lake outlines, stream courses and park boundaries come from their sources, and the docs say plainly where coverage stops.
- **Honest issue tracking.** Partly finished issues stayed open with a progress note instead of being closed.

### Where Canopy stands

A polished, distinctive front end on thin data. The map-first landing page, the island covers and the trip planner feel finished. But trails and places cover one corridor of one park, 64 of 347 provincial parks have a page, and fall color data is Ontario-only and seasonal. The "when to go" forecasting that the PRD calls the core promise has not started. It is a strong demo and a good personal tool; it is not yet useful to a stranger in Québec or British Columbia.

### Towards opening it to the public

1. **Clear what blocks any public use:** a restricted Mapbox token (#79), weather from a source licensed for it (#36), a privacy policy and terms (#69), and the button contrast (#63).
2. **Pick a narrow promise and fill it.** "Ontario fall colors and where to walk in them" is within reach: more areas (#85), a page for every park (#86), near me (#22).
3. **Add a safety net:** a few end-to-end tests on the view rules and deep links, error monitoring, and privacy-friendly analytics (#25).
4. **Soft launch to a small group.** Five to ten people on their own phones is the usability round in #19, and it will reorder the roadmap better than planning can.
5. **Name, domain and timing.** "Canopy" is still a working title (#2). The natural public launch is early September, before the next color season, which gives the forecasting work a real deadline.
6. **Decide what it is:** a free personal project, an open-source tool, or something built with partners such as Ontario Parks. That choice decides whether accounts, a backend and community reports are worth building.

### Actions

- [ ] Copy pass: rewrite the app's text in one voice, starting with About, Data sources and the design credits, which read stiff.
- [ ] Before each merge that changes routes or layout, check the deployed site as well as the local preview.
- [ ] For visual batches, review every item on one sheet before asking for feedback.
- [ ] Add a small set of end-to-end tests for view switching and deep links.
- [ ] Run the first usability round (#19) before starting new features.
