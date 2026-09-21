# 360 Pro install time study

Two versions of the same sheet. An installer enters how long each step of a 360 Pro install typically takes at a single-register store, in minutes, split into hands-on time and time spent waiting or interrupted.

| File | What it is |
|------|------------|
| `src/artifact.html` | Web app published as a claude.ai artifact. Installers save studies to shared storage; team averages sit behind a password under the gear icon. |
| `src/sheet.html` | Self-contained offline version. Works from a file on any device, totals as you type, and prints as a one-page blank form. |
| `index.html` | Built copy of the offline sheet at the repo root, so a static host such as Vercel serves it with no configuration. |
| `dist/` | Built copies with the POS360 logo inlined, plus the printed blank PDF. |

Live artifact: https://claude.ai/artifact/BiVD4DQBQ5euo2AdyUHMK8

## Steps

The rows mirror the 360 Pro quick install card.

- **Arrive and document**: check in, photos and video, unbox and stage
- **Wire it**: steps 1 to 8 from the card, plus waiting for online confirmation
- **Data transfer**: data pull, data conversion (both waiting)
- **Prove it works**: scan 20 items, one-cent sale and void, backup internet test, fix anything that failed
- **Go live**: merchant batches the old terminal (waiting), switch to live and remove the old hardware
- **Close out**: merchant walkthrough, Digital QC Sheet and photos, checkout notes
- **Miscellaneous, across the visit**: customer traffic, merchant questions, other interruptions (all counted as waiting or interrupted)

Step ids: `checkin photos unbox · brain ups wake printer term lcd periph cables isp · pull convert · scan sale lte fixes · batch switch · walk qc notes · traffic mxq other`. Waiting-type ids: `isp pull convert batch traffic mxq other`.

## Build

```bash
node build.mjs
```

Reads `logo.png`, inlines it into both sources, and writes `dist/artifact.html`, `dist/sheet.html`, and the root `index.html` (a copy of the sheet). To regenerate the blank PDF from the sheet (Windows, headless Edge):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File render-sheet.ps1
```

## The web app

`src/artifact.html` is written for the claude.ai artifact runtime and declares three capabilities: `db` (shared storage), `user` (viewer identity), and `downloads` (CSV export). Outside that runtime it opens in preview mode: totals still work, saving does not.

**Data.** One document per saved study in collection `studies`:

```json
{ "name": "…", "date": "2026-09-21", "exp": "6 to 20", "store": "Liquor",
  "minutes": { "checkin": 10, "brain": 15 }, "notes": { "term": "Merchant moved it twice" },
  "hands": 180, "wait": 95, "total": 275, "uid": "u_…", "createdAt": "2026-09-21T18:00:00Z", "v": 1 }
```

**Password gate.** Team averages open from the gear icon. Page editors bypass the gate and can set or change the password from the same dialog. Only a SHA-256 hash is stored, in document `config/gate`. Installers who unlock stay unlocked for the browser session. This hides results in the page; it is not a security boundary, since any signed-in member of the organization can read the shared store.

**Access.** A db artifact is organization-internal. Anyone saving a study must be signed in to a POS360 Claude account and hold "Can interact" or higher on the artifact.

**Republishing.** Edit `src/artifact.html`, run the build, then publish `dist/artifact.html` to the existing artifact URL from Claude Code.

## The offline sheet

`dist/sheet.html` can be sent as a file or hosted anywhere static; the root `index.html` is the same page, so connecting this repo to Vercel with no framework preset serves it at the project URL. It keeps a draft in the browser's local storage, copies a Slack-ready summary, downloads a CSV, and prints as a one-page blank paper form.
