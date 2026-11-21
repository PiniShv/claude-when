# Contributing to When

When is one small file, `hooks/register.tsx`. Read it before you change it: it
is short, and it is commented where the reason is not obvious.

## The promises

A change that breaks one of these is sent back, whatever else it does.

- One small file. No build step.
- No dependencies.
- No network calls, no telemetry, no account.
- It never blocks or breaks a prompt, a tool call or a turn. If the clock code
  fails, Claude Code carries on as if When were not there.

## Where things live

| Path | What it holds |
|---|---|
| `hooks/register.tsx` | the whole mod |
| `hooks/register.test.tsx` | its test |
| `.claude-plugin/` | the plugin manifest and the marketplace entry |
| `docs/` | the landing page: hand-written HTML, no build |

`.claude-plugin/types/` is written by Claude Code when it loads the mod. It is
not committed.

## Check your change

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

Then try it in a real session. Say which app you used in the pull request.
When is verified in the Claude Code desktop app, in the terminal and in the VS Code
panel. On the mobile app the time line is not drawn, because the app does not ask the mod
to draw; the hidden note for Claude still works there.

## Pull requests

- One change per pull request.
- Add a line under `## [Unreleased]` in `CHANGELOG.md` if a user would notice.
- Leave the version in `plugin.json` alone. It changes in the release.
- Squash merge only, so each change is one commit on `main`.
