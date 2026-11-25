# CAT Studio v3.1 — secure Render deployment

This folder is a **single-user, password-protected** Node.js deployment of CAT Studio. It serves the frontend and AI API on the same HTTPS origin. The static GitHub Pages preview remains separate.

## Deploy using Render Blueprint

1. Review and merge the pull request **cat-studio-render** into `master` after inspecting the changes.
2. In [Render Dashboard](https://dashboard.render.com/), choose **New → Blueprint**, connect your GitHub account, and select **uchanet/uchanet.github.io**.
3. Render reads the repository-root `render.yaml`, creates the `cat-studio-secure` Node web service and automatically assigns HTTPS.
4. Provide **OPENAI_API_KEY** and **CAT_STUDIO_PASSWORD** in the Render environment settings when prompted. Never put them in files, GitHub Actions logs, commits, or ChatGPT messages. Use a unique random password (20+ characters preferred). Render generates **CAT_SESSION_SECRET** automatically.
5. Deploy. Render will supply a `https://cat-studio-secure-...onrender.com` URL. Visit **/auth/login**, sign in with the password you chose, then open **/api/health** to confirm that `configured: true`.
6. Test one chat message, one OpenAlex search, and one AI-screening batch. Confirm the usage and billing dashboard in your OpenAI API project.
7. Keep `https://uchanet.github.io/cat-studio/` as the public static preview. Share the protected Render URL privately rather than exposing the login link publicly.

## Security architecture

- Protected GET routes and API routes; same-origin, POST-only JSON operations; signed, 8-hour, Secure/HttpOnly/SameSite=Strict session cookies.
- Password verified with scrypt and timing-safe comparison; basic login throttling and API throttling.
- Server-only OpenAI key (Responses API, `store:false`); optional server-only OpenAlex API key.
- No OpenAI credentials are present in the frontend or checked into GitHub.
- Body-size limits, upstream timeouts, no-store response headers, restrictive content security policy, and basic per-process AI budget.
- **Important:** this is a single-user password gate, not a full managed authentication system. Anyone possessing the workspace password can access the app and generate AI charges. Use a unique strong password and rotate if leaked.
- Rate limits are **in-memory**, reset on restart, and are not distributed across multiple instances. Set a hard project budget and monitor spending. For a multi-user public SaaS launch, migrate to managed identity (OIDC), persistent rate limits, stronger abuse prevention, and server-side user storage.
- CAT form drafts are stored in each browser's localStorage. They are not automatically synchronized between devices; export working JSON backups.
- Login protection does **not** protect the GitHub repository source code; it protects the running app and API. Never commit private professor/course resources without redistribution authorization.

## Official CAT submission

This public code release does not redistribute the professor's `Official_CAT_2026.html` template. Export the working JSON and load it into the **official form provided in your course materials**. Generate the required final HTML submission there. Do not submit an AI-generated draft as verified empirical evidence without full-text appraisal.

## Local checks

```bash
npm install --ignore-scripts
npm run check
CAT_STUDIO_PASSWORD='use-a-unique-long-password' CAT_SESSION_SECRET='use-a-long-random-session-secret-32chars' OPENAI_API_KEY='your-key-in-your-local-shell-only' node server.mjs
```

For local browser testing, the secure cookies require HTTPS. Use Render HTTPS for end-to-end login tests; do not disable the Secure flag in production. The local HTTP server can still be checked at `/healthz`.

## Costs

Render compute charges and OpenAI API charges are separate. The Blueprint defaults to Render's `free` web-service plan to avoid unexpected hosting charges. Free services may spin down after inactivity and incur a cold start. You can switch to a paid plan later if you need always-on availability.
