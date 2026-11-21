import type { EngineInterface, Register } from 'claude-code'

const two = (n: number) => String(n).padStart(2, '0')

export const clock = (ms: number) => {
  const d = new Date(ms)

  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}

// A row's time is decided the first time the row is drawn, then kept in the plugin's
// store so a resumed session still shows it. The terminal prints a row once and never
// redraws it, so a time cannot be added afterwards.
//   a prompt: the moment it was submitted
//   a reply:  the moment its first text was drawn, while a turn runs (between turn.start and turn.complete)
//   any other row (one from before When was installed): no time
// The desktop app draws a prompt when you send it, before the prompt hook has run. So a
// prompt row with no time yet is asked again at the next redraw, for a few seconds.

const KEEP = 20_000 // rows kept in the store; the oldest go first (the store holds 4 MiB in all)
const LOOK_AGAIN_MS = 120_000 // how long a prompt row with no time yet is asked again (a new session starts slowly)
const SENT_MS = 60_000 // how long a submitted prompt waits for its row

const sent: { text: string; ms: number }[] = [] // prompts submitted whose row is not drawn yet
const decided = new Map<string, Promise<number>>() // one decision per row, even for two draws at once
const firstSeen = new Map<string, number>() // when a prompt row was first drawn without a time
let isTurnRunning = false
let writes = 0

// The desktop app adds a <system-reminder> block to the first prompt of a session; the row shows only what was typed.
const typed = (text: string) => text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim()

type Row = { component: 'UserMessage' | 'AssistantMessage'; props: { text: string } }

const firstTime = async ($: EngineInterface, e: Row, isRecent: boolean) => {
  if (e.component === 'UserMessage') {
    if (!isRecent) {
      return 0 // an older row is history: it never takes a prompt's time
    }

    const i = sent.findIndex(s => s.text === e.props.text.trim())

    return i < 0 ? 0 : sent.splice(i, 1)[0].ms
  }

  return isTurnRunning ? $.clock.now() : 0
}

const decide = async ($: EngineInterface, id: string, e: Row, isRecent: boolean) => {
  const kept = await $.store.get(id)

  if (typeof kept === 'number') {
    return kept
  }

  const ms = await firstTime($, e, isRecent)

  if (ms) {
    await $.store.set(id, ms)

    if (++writes % 200 === 0) {
      const keys = await $.store.keys()
      await Promise.all(keys.slice(0, Math.max(0, keys.length - KEEP)).map(k => $.store.delete(k)))
    }
  }

  return ms
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const ms = await $.clock.now()

    if (!e.command) {
      sent.splice(0, sent.length, ...sent.filter(s => ms - s.ms < SENT_MS), { text: typed(e.text), ms })
    }

    // The model learns when each prompt was sent; the person sees the same time on the row.
    const note = `The user sent this prompt at ${clock(ms)}`
    const entered = await next({ ...e, context: [...(e.context ?? []), note] })

    try {
      $.ui.invalidate('ui.render') // a prompt row drawn before this hook ran can take its time now
    } catch {
      // a redraw that fails must never break a prompt
    }

    return entered
  }).catch(($, e, next) => next(e))

  // A subagent's turn starting or ending does not start or end the main one. A prompt typed while
  // a turn runs can start a turn of its own later, so the flag follows turns, not prompts.
  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      isTurnRunning = true
    }

    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    if (!e.agentId) {
      isTurnRunning = false
    }

    return next(e)
  })

  on('ui.render', { component: ['UserMessage', 'AssistantMessage'] }, async ($, e, next) => {
    // A message with no text (an image alone) is never asked of this hook.
    if (decided.size > 5000) {
      decided.clear() // the store still has them
      firstSeen.clear()
    }

    const id = e.requestId

    if (id === 'placeholder') {
      return next(e) // the terminal's stand-in for a prompt being sent is not a message
    }

    let isRecent = false
    let p = decided.get(id)

    if (!p) {
      if (e.component === 'UserMessage') {
        const now = await $.clock.now()
        isRecent = now - (firstSeen.get(id) ?? firstSeen.set(id, now).get(id)!) < LOOK_AGAIN_MS
      }

      p = decide($, id, e, isRecent)
      decided.set(id, p)
    }

    const ms = await p

    if (!ms && isRecent) {
      decided.delete(id) // a prompt row with no time yet: ask again at the next draw
    }

    if (!ms) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Text dimColor>{clock(ms)}</Text>
        {await next(e)}
      </Box>
    )
  })
}
