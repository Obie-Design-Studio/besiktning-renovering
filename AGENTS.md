<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment & environment (besiktning-renovering)

- **Local-first:** Assume day-to-day work targets **local development** (`npm run dev`, `.env.local`). Prefer verifying changes locally before any hosted deployment is discussed.
- **Production deploys:** Do **not** deploy to production (`vercel deploy --prod`, promoting Preview → Production, or any automated prod deploy) unless the user **explicitly** asks to deploy to production in that session.

Commands such as `git push` to `main` may trigger Vercel production deploys via Git integration — when pushing, warn the user if their repo is wired that way, or use a **feature branch** unless they explicitly want production updated.
