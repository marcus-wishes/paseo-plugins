# limit-resume

Paseo plugin that watches agents for provider usage / rate-limit failures and periodically sends a continue prompt once the limit window likely resets.

Requires **Paseo ≥ 0.10.3**.

## Behavior

1. **Detect** — On `agent.turn_ended`, match limit copy in the failure outcome or latest timeline output. A 60s tick also scans agents in `error` whose `lastError` matches.
2. **Queue** — Matching agents are enqueued with `nextAttemptAt = now + intervalMinutes`.
3. **Resume** — Due agents (concurrency 1) get `agent.send(continuePrompt)` unless `dryRun` is on (logs only). Running/initializing agents are deferred 60s.
4. **Clear** — Dropped when the agent recovers (non-limit turn), is archived/closed/missing, or hits `maxAttempts`.

Matched phrases (case-insensitive): `out of credits`, `credit balance`, `usage limit`, `rate limit`, `too many requests`, `quota`, `capacity`, `you've hit`, `overloaded`, `billing`, `spend limit`, `try again later`, `429`.

## Settings

Host-scoped; UI at **Settings → Limit resume** (also Command Center → “Configure limit resume”).

| Setting | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` | Master switch |
| `dryRun` | `true` | Log resumes; do not send |
| `intervalMinutes` | `15` | Wait between attempts (1–1440) |
| `maxAttempts` | `48` | Cap then dequeue (1–1000) |
| `continuePrompt` | *Continue the unfinished task…* | Text sent on resume |

Turn **dry run off** when you want live resumes. Check daemon logs:

```bash
paseo plugin logs limit-resume
```

Events: `queued`, `still_limited`, `resume_sent`, `resume_deferred`, `resume_failed`, `cleared`.

## Install

Enable plugins on the daemon, then:

```bash
paseo plugin install /absolute/path/to/limit-resume
# or from Git:
# paseo plugin add <owner>/limit-resume
paseo plugin ls
```

## Dev

```bash
npm install
npm run typecheck
npm test
npm run lint
```
