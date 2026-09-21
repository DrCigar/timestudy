# 360 Pro install time study

Two versions of the same sheet. An installer enters how long each step of a 360 Pro install typically takes at a single-register store, in minutes, split into hands-on time and time spent waiting or interrupted.

| File | What it is |
|------|------------|
| `src/app.html` | The web app. Dark by design. Installers save studies; team averages sit behind a password under the gear icon. Runs in two places: as a claude.ai artifact (storage from the artifact runtime) and on Vercel (storage from `/api` on Neon Postgres). |
| `src/sheet.html` | Self-contained offline version. Works from a file on any device, totals as you type, and prints as a one-page blank form. |
| `index.html` | Built copy of the app at the repo root. Vercel serves it at the project URL. |
| `api/` | Vercel serverless functions: `gate.js` (results password) and `studies.js` (saved studies), both on Neon Postgres via `DATABASE_URL`. |
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

Reads `logo.png`, inlines it into both sources, and writes `dist/app.html`, `dist/sheet.html`, and the root `index.html` (a copy of the app). To regenerate the blank PDF from the sheet (Windows, headless Edge):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File render-sheet.ps1
```

## The web app

`src/app.html` picks its storage at load time:

- Inside the claude.ai artifact runtime it uses the `db`, `user`, and `downloads` capabilities.
- On any other host it looks for `/api/gate` on the same origin. If it answers, the page uses this repo's API. If the API answers 500, the database is not attached yet and the page says so. If there is no API at all, the page runs in preview mode: totals and the Slack summary work, saving does not.

### Deploying on Vercel

1. Import the repo in Vercel. Framework preset: Other. No build command; the root `index.html` and `api/` are deployed as they are.
2. In the project, open Storage and attach **Neon** from the Marketplace. This creates the database and sets `DATABASE_URL` for the project.
3. Redeploy. The API creates its two tables on first request.
4. Open the site, click the gear, and set the results password. Whoever knows the password can open the averages, export the CSV, remove entries, and change the password.

On Vercel the password does more than hide a tab: `GET /api/studies` and `DELETE` require the unlocked hash in the `x-results-key` header, so results are not readable without it. Adding a study (`POST`) is open to anyone with the URL, which is the point of the page.

**Data.** One document per saved study in collection `studies`:

```json
{ "name": "…", "date": "2026-09-21", "exp": "6 to 20", "store": "Liquor",
  "minutes": { "checkin": 10, "brain": 15 }, "notes": { "term": "Merchant moved it twice" },
  "hands": 180, "wait": 95, "total": 275, "uid": "u_…", "createdAt": "2026-09-21T18:00:00Z", "v": 1 }
```

**Password gate.** Team averages open from the gear icon. Only a SHA-256 hash of the password is ever stored (artifact: document `config/gate`; Vercel: table `gate`). Installers who unlock stay unlocked for the browser session. On the artifact, page editors bypass the gate and set the password; the gate hides results in the page but any signed-in org member could read the shared store directly. On Vercel, the API enforces it.

**Access.** A db artifact is organization-internal. Anyone saving a study must be signed in to a POS360 Claude account and hold "Can interact" or higher on the artifact.

**Republishing the artifact.** Edit `src/app.html`, run the build, then publish `dist/app.html` to the existing artifact URL from Claude Code. Pushing to `main` updates the Vercel deployment.

## The offline sheet

`dist/sheet.html` is the light, paper-styled version for sending as a file or printing. It keeps a draft in the browser's local storage, copies a Slack-ready summary, downloads a CSV, and prints as a one-page blank paper form.
