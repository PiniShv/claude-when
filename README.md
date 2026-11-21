# When

[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

**The date and time on every message in Claude Code.**

![When showing a time above each message](docs/media/demo.gif)

Claude Code does not show when a message was sent. In a long session you cannot
tell when you asked something, or how long a step took.

When adds a quiet line above each message:

```
2026-11-21 19:15:26
Run the full test suite and fix what fails.

2026-11-21 19:15:31
On it. Running the suite now.
```

## What it does

- **Your messages and Claude's replies both get a time.** Date and time, in your
  local time zone.
- **A reply's time is when Claude started writing it.** The gap between two lines
  is how long the work took.
- **Claude knows the time too.** Each prompt carries a hidden note with its send
  time. Ask "how long did that take?" and Claude can answer from real times.

## Install

**Desktop app:** click `+` next to the prompt box, then **Plugins**, then
**Add marketplace**. Enter `PiniShv/claude-when`, then choose **Add plugin**.

**Terminal session:**

```
/plugin install when --marketplace PiniShv/claude-when
```

**Shell:**

```bash
claude plugin install when --marketplace PiniShv/claude-when
```

To remove it, uninstall the `when` plugin the same way you installed it.

## Nothing to trust

- One TypeScript file, about 150 lines. Read it: [hooks/register.tsx](hooks/register.tsx).
- No dependencies.
- No network calls, no telemetry, no account. It reads your computer's clock and
  keeps one time per message in a small file on your computer.

## Good to know

- Works in the Claude Code desktop app, in the terminal and in the VS Code panel. On the Claude mobile app the time line is not drawn, because the app does not ask the mod to draw. Claude still gets the send time of each message you type there.
- In VS Code the app draws the time in a small card labelled with the plugin's name.
- Times are saved on your computer, for the last 20,000 messages. A resumed session shows the times of messages sent after When was installed.
- Needs a Claude Code version that supports mods.
- A message that is only an image, with no text, gets no time.
- Messages from before you installed When get no time.

## How it works

When is a mod: a small plugin that draws on Claude Code's own message rows.

1. When you send a prompt, it notes the time and adds it to what Claude reads.
2. The first time a message is drawn, it puts that time on a dim line above the
   message and saves it. A reply's time is the moment Claude started writing it.
3. When you resume a session, the saved times are drawn again.

The transcript is not changed. The time line is drawn on screen only.

## Develop

```bash
claude plugin validate .
```

```bash
claude plugin test .
```

## More

[Contributing](CONTRIBUTING.md) · [Security policy](SECURITY.md) · [Changelog](CHANGELOG.md) · [Code of conduct](CODE_OF_CONDUCT.md)

## License

[Apache License 2.0](LICENSE) © 2026 Pini Shvartsman

When is an independent project. It is not made by or affiliated with Anthropic.
