/* When: the chat window, drawn from one list of messages.
   <div data-sim="loop|once|static" [data-from="0" data-to="5"] [data-k="2.6"] [data-fixed]></div>
   loop: runs, fades, runs again (pause button). once: runs, holds its last frame, sets window.__demoDone.
   static: the finished window. ?t=<seconds> freezes a "once" run at that moment.
   The times are the visitor's own clock, so the story ends about now. data-fixed gives the same
   example times on every run, for a recording.
   Elements with data-msg="n" (the timeline) show the time of message n. */
(() => {
  // off: seconds after the first message. In a line, {@n} is the time of message n, and {dur} is
  // how long the tests took: from the first message to the third.
  const MSGS = [
    { r: 'u', at: .5,  off: 0,   text: 'Run the full test suite and fix what fails.' },
    { r: 'a', at: 2.1, off: 5,   lines: ['Running the full suite.', 'Three tests fail. Fixing them now.', 'Fixed. Running the suite again.'], ran: 'Ran 14 commands', ranAt: 4.9 },
    { r: 'a', at: 6.3, off: 252, lines: ['<b>All 212 tests pass now.</b>'] },
    { r: 'u', at: 8.6, off: 516, text: 'How long did that take?' },
    { r: 'a', at: 10.6, off: 518, lines: ['{dur}. You asked at {@0} and the tests passed at {@2}.'] },
  ];
  const tookS = MSGS[2].off - MSGS[0].off;
  const DUR = `${Math.floor(tookS / 60)} minutes ${tookS % 60} seconds`;
  const FIXED = new Date(2026, 10, 21, 19, 15, 26).getTime();
  const LIVE = Math.floor(Date.now() / 1000) * 1000 - (MSGS[MSGS.length - 1].off + 2) * 1000;
  const two = n => String(n).padStart(2, '0');
  const hms = ms => { const d = new Date(ms); return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`; };
  const ymd = ms => { const d = new Date(ms); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`; };
  const END = 15.2, PERIOD = 18.6, FADE_AT = 17.2, CPS = 34, LAND = .3, SETTLE = 1.7;
  const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  // one span per character so the text can grow while the line breaks stay put
  function chars(parent, html) {
    const out = [];
    const tmp = el('div', '', html.replace(/\{([^}]+)\}/g, '<i class="tm">$1</i>'));
    const walk = (node, into, cls) => node.childNodes.forEach(n => {
      if (n.nodeType === 3) for (const ch of n.nodeValue) { const s = el('span', 'c' + (cls ? ' ' + cls : '')); s.textContent = ch; into.append(s); out.push(s); }
      else if (n.nodeName === 'B') { const b = el('b'); into.append(b); walk(n, b, cls); }
      else walk(n, into, n.className === 'tm' ? 'tm' : cls);
    });
    walk(tmp, parent, '');
    return out;
  }

  function build(root) {
    const mode = root.dataset.sim || 'loop';
    const from = +(root.dataset.from || 0), to = +(root.dataset.to || MSGS.length);
    const k = root.dataset.k;
    const base = root.dataset.fixed !== undefined ? FIXED : LIVE;
    const at = off => base + off * 1000;
    const ws = el('div', 'ws' + (mode === 'static' ? ' is-static' : ''));
    if (k) ws.style.setProperty('--ws-k', k);
    ws.innerHTML = '<div class="ws__bar"><span class="ws__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ws__title">Session</span></div>';
    const body = el('div', 'ws__body'), flow = el('div', 'ws__flow');
    body.append(flow); ws.append(body);
    ws.append(el('div', 'ws__input', '<span>Message</span><i></i>'));
    const items = [];
    MSGS.slice(from, to).forEach(m => {
      const box = el('div', 'm ' + (m.r === 'u' ? 'm--user' : 'm--asst'));
      const time = el('span', 'm__time'); time.textContent = ymd(at(m.off)) + ' ' + hms(at(m.off)); box.append(time);
      const it = { m, box, time, cs: [], bubble: null, ran: null };
      if (m.r === 'u') { it.bubble = el('div', 'm__bubble'); it.bubble.textContent = m.text; box.append(it.bubble); }
      else {
        const t = el('div', 'm__text');
        const line = l => l.replace('{dur}', DUR).replace(/\{@(\d+)\}/g, (_, i) => '{' + hms(at(MSGS[i].off)) + '}');
        m.lines.forEach(l => { const p = el('p'); t.append(p); it.cs.push(...chars(p, line(l))); });
        box.append(t);
        if (m.ran) { it.ran = el('div', 'm__ran', CHEV + '<span>' + m.ran + '</span>'); box.append(it.ran); }
      }
      flow.append(box); items.push(it);
    });
    root.replaceChildren(ws);
    return { root, mode, ws, body, flow, items, last: -2, shift: 0 };
  }

  function render(s, t) {
    s.items.forEach(it => {
      const age = t - it.m.at;
      const on = age >= 0;
      const a = clamp(age / LAND);
      it.box.style.opacity = on ? 1 : 0;
      it.box.style.transform = `translateY(${(1 - a) * .45}em)`;
      // the time lands first, with a small lift of emphasis, then settles to a dim line
      const e = age < LAND ? 1 : 1 - clamp((age - LAND) / (SETTLE - LAND));
      it.time.style.setProperty('--e', (e * e * (3 - 2 * e)).toFixed(3));
      it.time.style.opacity = on ? 1 : 0;
      const ta = age - .3;
      if (it.bubble) it.bubble.style.opacity = clamp(ta / .3);
      if (it.cs.length) {
        const n = Math.max(0, Math.floor(ta * CPS));
        if (it.n !== n) { it.n = n; it.cs.forEach((c, j) => c.classList.toggle('on', j < n)); }
      }
      if (it.ran) it.ran.style.opacity = clamp((t - it.m.ranAt) / .4);
    });
    // look ahead so the window has scrolled before the next message arrives, and scroll in whole messages
    let ahead = -1;
    s.items.forEach((it, i) => { if (t + .5 >= it.m.at) ahead = i; });
    if (ahead !== s.last) {
      s.last = ahead;
      const room = s.body.clientHeight, cs = getComputedStyle(s.flow), padT = parseFloat(cs.paddingTop), padB = parseFloat(cs.paddingBottom);
      const K = s.items[Math.max(0, ahead)], need = K.box.offsetTop + K.box.offsetHeight + padB;
      let shift = 0;
      for (let j = 0; j <= Math.max(0, ahead); j++) { shift = Math.max(0, s.items[j].box.offsetTop - padT); if (need - shift <= room) break; }
      s.shift = shift;
      s.flow.style.transform = `translateY(${-s.shift}px)`;
    }
  }

  function pauseButton(s, root, state) {
    const btn = el('button', 'loop-pause ws-pause'); btn.type = 'button';
    const icon = on => `<svg viewBox="0 0 14 14" aria-hidden="true">${on ? '<path d="M3 2h3v10H3zM8 2h3v10H8z"/>' : '<path d="M4 2l8 5-8 5z"/>'}</svg>`;
    const set = p => {
      state.paused = p;
      btn.setAttribute('aria-label', p ? 'Play the demo' : 'Pause the demo'); btn.setAttribute('aria-pressed', String(p)); btn.innerHTML = icon(!p);
      if (p) state.held = performance.now() - state.t0; else state.t0 = performance.now() - state.held;
    };
    set(false); btn.addEventListener('click', () => set(!state.paused));
    (root.closest('.hero__art, [data-sim-host]') || root).append(btn);
  }

  function mount(root) {
    const s = build(root);
    const q = new URLSearchParams(location.search).get('t');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // draw the finished window (or the frozen moment) again once the fonts are in
    const rest = at => { const again = () => { s.last = -2; render(s, at); }; again(); requestAnimationFrame(again); document.fonts && document.fonts.ready.then(again); };
    if (s.mode === 'static') { render(s, 99); s.flow.style.transform = 'none'; return; }
    if (reduced) { rest(99); return; }
    if (q !== null && s.mode === 'once') { rest(+q); return; }
    s.flow.classList.add('is-eased');
    const state = { t0: performance.now(), paused: false, held: 0 };
    let raf = 0, done = false;
    const relayout = () => { s.last = -2; };
    addEventListener('resize', relayout);
    document.fonts && document.fonts.ready.then(relayout);
    if (s.mode === 'loop') pauseButton(s, root, state);
    const tick = now => {
      raf = requestAnimationFrame(tick);
      if (state.paused || document.hidden) { if (!state.paused) state.t0 = now - state.held; return; }
      let t = (now - state.t0) / 1000;
      if (s.mode === 'loop') {
        const u = t % PERIOD;
        if (u < .2 && t > PERIOD / 2) s.last = -2;
        s.flow.classList.toggle('is-fading', u > FADE_AT);
        s.flow.style.opacity = u > FADE_AT ? 0 : 1;
        render(s, u);
      } else {
        t = Math.min(t, END); render(s, t);
        if (t >= END && !done) { done = true; window.__demoDone = true; cancelAnimationFrame(raf); }
      }
      state.held = now - state.t0;
    };
    raf = requestAnimationFrame(tick);
  }

  const stamps = () => document.querySelectorAll('[data-msg]').forEach(li => {
    const ms = LIVE + MSGS[+li.dataset.msg].off * 1000, t = li.querySelector('time'), d = li.querySelector('.d');
    if (t) { t.textContent = hms(ms); t.setAttribute('datetime', ymd(ms) + 'T' + hms(ms)); }
    if (d) d.textContent = ymd(ms);
  });
  const go = () => { document.querySelectorAll('[data-sim]').forEach(mount); stamps(); };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
