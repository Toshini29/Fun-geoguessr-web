# Luthen's Coordinates

A companion site for a custom GeoGuessr map. Nine encrypted "transmissions" (one per map location) each describe the Star Wars / Andor scene filmed there, with three hints you decrypt one at a time. Solve each one by naming the country.

## Files
- `index.html`, `styles.css`, `app.js`: the site
- `dossiers.js`: the scene descriptions and hints for each location
- `config.js`: **edit this** (his name, your name, challenge link, site URL)
- `card.html`: printable 4×6 in card with a QR code
- `locations.json`: the original GeoGuessr map export

## Publish (GitHub Pages)
1. Push these files to the root of the repo's `main` branch.
2. On GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**.
3. After a minute or so the site is at `https://<username>.github.io/<repo>/`.
4. Put that URL in `config.js` as `siteUrl`, push again, then open `/card.html` and print.
