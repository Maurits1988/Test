<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- The app lives in `tsa-wait-times/` (Next.js 16, App Router, Turbopack). Run all commands from that directory. Standard scripts are in `package.json`: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`.
- Dev server runs at `http://localhost:3000`.
- The two API routes (`app/api/lga`, `app/api/iah`) scrape/call external airport sites. In the restricted cloud network these fetches fail, and the routes intentionally return HTTP 200 with an `error` field and empty `checkpoints`; the UI then shows a "Live data unavailable" state. This is expected here and is not an app bug — do not treat blocked external fetches as a failure.
