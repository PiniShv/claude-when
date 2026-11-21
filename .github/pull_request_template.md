<!-- Read CONTRIBUTING.md first. The promises there (one small file, no
     dependencies, no network calls, no telemetry) are not style: a change that
     breaks one is sent back, whatever else it does. One change per PR. -->

## What changes

<!-- What this does and why, in a few direct sentences.
     If it fixes an issue, write "Closes" and the issue number. -->

## Test plan

- [ ] `claude plugin validate .`
- [ ] `claude plugin test .`
- [ ] Tried in a real Claude Code session: <!-- which app, and which messages showed a time -->

## Before you submit

- [ ] A line under `## [Unreleased]` in `CHANGELOG.md`, if a user would notice the change
- [ ] The version in `.claude-plugin/plugin.json` is unchanged (it changes in the release)
