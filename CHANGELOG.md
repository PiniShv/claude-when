# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-21

### Added

- Times are saved between sessions, for the last 20,000 messages. A resumed
  session shows the times of messages sent after When was installed.
- It works in the Claude Code terminal and in the VS Code panel. A message's time is taken when it is sent,
  so it is there the first time the message is drawn. The terminal never redraws
  a message, so a time added later would not show.

### Known limits

- On the Claude mobile app the time line is not drawn. Claude still gets the send time
  of each message.

### Changed

- The mod is simpler: a time is decided the first time a message is drawn. It no
  longer reads the transcript.
- The time on your message and the time in the hidden note for Claude are now
  the same value.

## [0.1.1] - 2026-11-21

### Fixed

- The first message of a new session now gets a time. Before, only later
  messages did.

## [0.1.0] - 2026-11-21

### Added

- A dim date and time line above each message you send and each reply from
  Claude, in your local time. A reply's time is when Claude started writing it.
- A hidden note with each prompt's send time, so Claude can answer "how long did
  that take?" from real times.
