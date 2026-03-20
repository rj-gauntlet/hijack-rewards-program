# ADR-007: Custom Calendar Heat Map

## Status
Accepted

## Context
The spec says "Build the 30-day heat map. You can use a library (e.g., `react-calendar-heatmap`) or build from scratch."

## Decision
Build the calendar heat map from scratch using MUI's Box component with CSS Grid.

## Rationale
- **Full control**: The spec requires a specific 5-color scheme (gray, light green, dark green, blue, red) that maps to 5 activity types. A library would need significant customization to match.
- **Proper calendar layout**: 7-column grid with day-of-week headers and correct first-day offset — a standard heat map library (GitHub-style) uses a different layout
- **Tooltips**: Each cell shows date, activity type, and streak counts on hover — easier to implement with direct MUI Tooltip integration
- **Legend**: Custom legend matching the exact activity types and colors
- **No extra dependency**: Avoids adding a library for a single component
- **Dark theme**: Colors are tuned for the dark background (#0D1117) — `#2D333B` for no activity, `#0E4429`/`#26A641` for login/play, `#1F6FEB` for freeze, `#DA3633` for broken

## Consequences
- More code than using a library (~100 lines vs. ~20 with a wrapper)
- Need to handle month boundary calculations manually (first day offset, days in month)
- Responsive behavior must be implemented manually (works well with CSS Grid)

## Color Mapping

| Activity       | Color     | Hex       |
|----------------|-----------|-----------|
| No activity    | Gray      | `#2D333B` |
| Login only     | Light green | `#0E4429` |
| Played         | Dark green | `#26A641` |
| Freeze used    | Blue      | `#1F6FEB` |
| Streak broken  | Red       | `#DA3633` |
