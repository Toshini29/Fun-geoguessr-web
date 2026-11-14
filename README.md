# Luthen's Coordinates

A Star Wars-themed GeoGuessr-style birthday game. Each round jumps you through hyperspace to an unnamed world.
You see it from orbit, land, look around a 360° scene for clues, then pin the world on a galaxy navicomputer.
Ten rounds, up to 5,000 points each. The final screen has a birthday message and links to a real GeoGuessr challenge
of the filming locations.

Everything is drawn in code (no images or movie assets) and sound is synthesized, so it works offline once loaded.

## Files
- `index.html`, `styles.css`: page and layout
- `js/engine.js`: renderer (hyperspace, planets, 360° scenes, galaxy map)
- `js/scenes.js`: the ten world scenes
- `js/worlds.js`: world data, hints, reveals, map positions
- `js/audio.js`: sound effects
- `js/game.js`: game flow
- `config.js`: **edit this**: names, birthday message, GeoGuessr challenge link, site URL
- `card.html`: printable 4×6 in card with a QR code
- `locations.json`: the original GeoGuessr map export

## Testing
- `?skip` skips the intro.
- `?scene=hoth` (or any world id) jumps straight to a surface; `?orbit=hoth` shows a planet. Test links never save progress.
- Progress is saved per device. Use **Restart** on the title screen to wipe it.

## Publish
Push to `main`. GitHub Pages (Settings → Pages → `main` / root) serves it at `https://<username>.github.io/<repo>/`.
