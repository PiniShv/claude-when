import { expect, mock, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { clock } from './register'

type Driver = Parameters<TestBody>[0]
type On = Parameters<TestBody>[1]

const START = new Date(2026, 10, 21, 19, 0, 0).getTime()
const SURFACES = ['terminal', 'desktop', 'vscode', 'mobile'] as const
type Surface = (typeof SURFACES)[number]
type Component = 'UserMessage' | 'AssistantMessage'

// The module keeps rows in memory between tests, so every test draws rows of its own.
let n = 0
const newId = (prefix: string) => `${prefix}-${++n}`

// The engine beneath the mod: a clock that only the test moves, a store, and a plain drawing.
const engine = (on: On, stored?: Record<string, unknown>) => {
  const time = mock.clock(on, { now: START })
  mock.store(on, stored)
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>{(e.props as { text: string }).text}</Text>
  })

  return time
}

const submit = ($: Driver, text: string, command?: { name: string; args: string }) =>
  $.prompt.submit({ text, command, wait: false, origin: { kind: 'composer' } })

let turn = 0
const startTurn = ($: Driver, agentId?: string) => $.turn.start({ text: '', turnId: `turn-${++turn}`, agentId })
const endTurn = ($: Driver, agentId?: string) =>
  $.turn.complete({ answer: '', durationMs: 0, isAborted: false, turnId: `turn-${turn}`, agentId, reason: 'answer' })

const mountRow = ($: Driver, surface: Surface, component: Component, requestId: string, text: string) =>
  component === 'UserMessage'
    ? $.ui.mount({ plugin: 'when', surface, component, requestId, props: { text, origin: { kind: 'composer' }, isExpanded: false } })
    : $.ui.mount({ plugin: 'when', surface, component, requestId, props: { text, isFirstOfReply: true } })

// The time line above a row, or undefined when the row has none.
const timeAbove = async ($: Driver, surface: Surface, component: Component, requestId: string, text: string) => {
  const ui = await mountRow($, surface, component, requestId, text)
  const line = await ui.find({ type: 'Text', text: /^\d{4}-\d\d-\d\d / })
  await ui.unmount()

  return line?.text
}

test('clock gives a padded local date and time', () => {
  expect(clock(new Date(2026, 0, 2, 3, 4, 5).getTime())).toBe('2026-01-02 03:04:05')
})

for (const surface of SURFACES) {
  test(`a prompt shows the time it was sent, at its first draw (${surface})`, async ($, on) => {
    const time = engine(on)
    const row = newId('user')

    await submit($, 'hello there')
    await time.advance(5_000)

    // the time of the submit, not of the draw five seconds later
    expect(await timeAbove($, surface, 'UserMessage', row, 'hello there')).toBe(clock(START))
  })
}

test('a reply drawn while a turn runs gets that moment, and keeps it', async ($, on) => {
  const time = engine(on)
  const row = newId('reply')

  await submit($, 'go')
  await startTurn($)
  await time.advance(2_000)
  const first = await timeAbove($, 'desktop', 'AssistantMessage', row, 'On it.')
  await time.advance(60_000)
  const later = await timeAbove($, 'desktop', 'AssistantMessage', row, 'On it. Done.')

  expect(first).toBe(clock(START + 2_000))
  expect(later).toBe(first)
})

test('a prompt typed during a turn gets times on the turn it starts later', async ($, on) => {
  const time = engine(on)

  await submit($, 'first')
  await startTurn($)
  await submit($, 'typed while it runs')
  await endTurn($)
  await time.advance(5_000)
  await startTurn($) // the queued prompt runs as a turn of its own

  expect(await timeAbove($, 'desktop', 'AssistantMessage', newId('queued'), 'Second answer.')).toBe(clock(START + 5_000))
})

test('a subagent turn ending does not end the main turn', async ($, on) => {
  engine(on)

  await startTurn($)
  await endTurn($, 'sub-1')

  expect(await timeAbove($, 'desktop', 'AssistantMessage', newId('main'), 'Still going.')).toBe(clock(START))
})

test('a row drawn with no turn running and nothing stored gets no time', async ($, on) => {
  engine(on)
  await endTurn($)

  expect(await timeAbove($, 'terminal', 'AssistantMessage', newId('old'), 'From before.')).toBeUndefined()
})

test('a resumed session shows the time that was stored', async ($, on) => {
  const row = newId('stored')
  engine(on, { [row]: START })

  expect(await timeAbove($, 'terminal', 'AssistantMessage', row, 'Kept.')).toBe(clock(START))
})

test('the oldest times go when more than 20,000 are saved', async ($, on) => {
  const stored = Object.fromEntries(Array.from({ length: 20_300 }, (_, i) => [`old-${i}`, START]))
  engine(on, stored)

  await startTurn($)
  // every first draw of a reply saves one time; the store trims itself every 200 saves
  for (let i = 0; i < 200; i++) {
    await timeAbove($, 'terminal', 'AssistantMessage', newId('fill'), `reply ${i}`)
  }
  await endTurn($)

  expect(await timeAbove($, 'terminal', 'AssistantMessage', 'old-0', 'Oldest.')).toBeUndefined()
  expect(await timeAbove($, 'terminal', 'AssistantMessage', 'old-20299', 'Newest.')).toBe(clock(START))
})

// The desktop app draws a prompt when you send it, before the prompt hook has run.
test('a prompt drawn before it is submitted gets its time at the next draw', async ($, on) => {
  const time = engine(on)
  const row = newId('early')

  expect(await timeAbove($, 'desktop', 'UserMessage', row, 'sent later')).toBeUndefined()
  await submit($, 'sent later')
  await time.advance(1_000)

  expect(await timeAbove($, 'desktop', 'UserMessage', row, 'sent later')).toBe(clock(START))
})

test('an older row with the same text does not take a new prompt\'s time', async ($, on) => {
  const time = engine(on)
  const older = newId('older')
  const fresh = newId('fresh')

  expect(await timeAbove($, 'desktop', 'UserMessage', older, 'yes')).toBeUndefined()
  await time.advance(150_000) // longer than the two minutes a prompt row is asked again
  await submit($, 'yes')

  expect(await timeAbove($, 'desktop', 'UserMessage', older, 'yes')).toBeUndefined()
  expect(await timeAbove($, 'desktop', 'UserMessage', fresh, 'yes')).toBe(clock(START + 150_000))
})

test('a prompt that arrives wrapped in a system-reminder matches the row that shows only what was typed', async ($, on) => {
  const time = engine(on)
  const row = newId('wrapped')

  await submit($, '<system-reminder>\nThe session started here.\n</system-reminder>\n\ntesting 1 2 3')
  await time.advance(1_000)

  expect(await timeAbove($, 'desktop', 'UserMessage', row, 'testing 1 2 3')).toBe(clock(START))
})

test('a prompt row drawn a minute before the prompt hook ran still gets its time', async ($, on) => {
  const time = engine(on)
  const row = newId('slow')

  expect(await timeAbove($, 'desktop', 'UserMessage', row, 'slow start')).toBeUndefined()
  await time.advance(60_000)
  await submit($, 'slow start')

  expect(await timeAbove($, 'desktop', 'UserMessage', row, 'slow start')).toBe(clock(START + 60_000))
})

test('a slash command is not kept to match a row', async ($, on) => {
  engine(on)

  await submit($, '/model haiku', { name: 'model', args: 'haiku' })

  expect(await timeAbove($, 'desktop', 'UserMessage', newId('command'), '/model haiku')).toBeUndefined()
})

test('a submitted prompt is forgotten after a minute without a row', async ($, on) => {
  const time = engine(on)

  await submit($, 'never drawn')
  await time.advance(61_000)
  await submit($, 'another one') // trims what waited too long

  expect(await timeAbove($, 'desktop', 'UserMessage', newId('late'), 'never drawn')).toBeUndefined()
})

test('the terminal\'s placeholder row is not a message and does not take the prompt\'s time', async ($, on) => {
  engine(on)

  await submit($, 'typed text')

  expect(await timeAbove($, 'terminal', 'UserMessage', 'placeholder', 'typed text')).toBeUndefined()
  expect(await timeAbove($, 'terminal', 'UserMessage', newId('real'), 'typed text')).toBe(clock(START))
})
