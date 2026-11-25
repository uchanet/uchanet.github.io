# CAT Studio — public Render deployment

This folder contains the public CAT Studio Node.js app and its server-side AI API. Anyone with the Render URL can use the app and Ask AI. The static GitHub Pages preview remains separate.

## Render deployment

1. The repository root `render.yaml` configures the `cat-studio-secure` web service on Render's free plan.
2. Set `OPENAI_API_KEY` as a Render secret. Keep it out of source files, GitHub, browser code, and chat messages.
3. Deploy from the `master` branch and open the Render URL. No workspace password is required.
4. Test Ask AI with non-sensitive sample text and monitor the OpenAI project usage and billing.

## Public access and AI usage

- Anyone with the URL can open CAT Studio and make AI requests through the owner's OpenAI account. Do not put private, confidential, or personally identifying information in the public app.
- The OpenAI key stays on the server. The app enforces same-origin API requests, request-size limits, a per-IP hourly API throttle, and a global in-memory daily AI request limit.
- The daily limit defaults to 80 calls and is not a hard spending cap. In-memory limits reset on service restarts and are local to each instance. Set a hard budget or usage limits in the OpenAI project and monitor spending.
- Render's free service may spin down when idle, causing a cold start. Render hosting and OpenAI usage are billed separately.
- CAT form drafts are stored in each visitor's browser localStorage; they are not synced between devices. Export JSON backups.
- The public GitHub source does not include the professor's course-only template. Use the official form provided in course materials and verify all empirical claims against full text before submission.

## Local checks

```bash
npm install --ignore-scripts
npm run check
OPENAI_API_KEY='your-key-in-your-local-shell-only' node server.mjs
```
