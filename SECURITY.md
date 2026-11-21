# Security Policy

## Reporting a vulnerability

Use **Report a vulnerability** on the repository's
[Security tab](https://github.com/PiniShv/claude-when/security). It opens a
private report that only the maintainer can read.

Do not open a public issue for something that lets one person's code or data
reach another's.

Include:

- what you did, in steps anyone can repeat
- what happened, and what you expected instead
- your When version (`claude plugin list`) and Claude Code version

Expect an answer within a few days. This is a one-person project with no bug
bounty and no formal deadline. Please give me a reasonable time to ship a fix
before you publish. You get credit in the changelog if you want it.

## Trust model

Read this before deciding whether a finding is a bug.

- **When runs inside Claude Code, with your permissions.** It is a mod: one
  TypeScript file, about 150 lines. It has no server, no background process and
  no helper program.
- **It makes no network calls.** No telemetry, no analytics, no update check.
- **It reads your computer's clock and nothing else.** It saves one time per
  message in a small file of its own in your Claude Code configuration folder:
  about 60 bytes a message, for the last 20,000 messages. It writes no other
  files.
- **It changes what you see, not what is saved.** The time line is drawn on
  screen. The saved transcript is not changed. One hidden note per prompt, with
  its send time, reaches Claude.

## In scope

- a way to make When send data anywhere, or write a file other than its own
  times file
- a way to make the hidden note carry text the user did not type
- a way to make When break or block a prompt or a turn

## Out of scope

- bugs in Claude Code itself
- a wrong or missing time on a message (open a normal issue)
- anything that needs access to your computer first
