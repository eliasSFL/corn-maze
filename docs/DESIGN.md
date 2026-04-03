# DESIGN.md

> **Audience:** Game designers, narrative, and coding agents making gameplay or UI decisions.

## Agent summary

Mini-games are set in **Sunflower Land**: a **web3 farming community** with friendly **Bumpkin** characters. Tone is **brief** and **PG**. Prefer **resource and grind** loops over pure physics gimmicks. Use a **30° top-down** presentation: **walk-around / light RPG** feel, **not** platformers, side-on, or pure top-down shooters. Aim for a **10-second** understood loop and **60-second** first completion where possible.

The default **Boring** sample uses **`BumpkinContainer`** in **`MainScene`** (see **`GAME_SPEC.md`**). Add **`@sl-assets`** pickups in your own scenes as needed.

## Setting & tone

- **Bumpkins** are the default player-facing characters for Sunflower Land experiences.
- Dialogue: **short**, **friendly**, **PG**.
- Other NPC types: only when justified; default to Bumpkins for consistency.

## Gameplay pillars

1. **Short sessions** + **grind** — players return to earn currency/resources and upgrade.
2. **Resource economy** — inflating currency (e.g. coins) converts into other resources and sinks.
3. **Sinks** — upgrades, cosmetics, achievements; avoid infinite inflation with no spend.
4. **Collect-them-all** — strong motivation for completionists.
5. **Repeatable core loop** — understandable in ~**10s**, first loop done in ~**60s** when feasible.

## What to avoid

- **Physics-only gimmicks** as the sole hook (players tire quickly).
- **Platformer / side-on** as the primary format for this template’s design language.
- **Punishing** or non-PG tone.

## World presentation

- **30° top-down** art language.
- World elements often sit on a **grid**; **movement can still be free** between areas.
- **Collision** should match the art: hitboxes around the **base** of objects (see `ART.md`).

## Economy layers

- **Fast / inflating** — gathered quickly in play (e.g. coins per action).
- **Slower / tradeable** — meaningful on-platform trade; build quests around converting the former into the latter.

## Self-contained mini-games

- Each clone should be **playable alone**; optional links to the wider Sunflower Land ecosystem later.
- **Anonymous play** allowed; nudge sign-up where appropriate (see `TECHNICAL.md`, `API.md`).

## Related docs

- `GAME_SPEC.md` — project-specific numbers and rules (you maintain this).
- `UI_UX_GUIDELINES.md` — how win/lose and flows appear in UI.
- `ART.md` — visual rules.
