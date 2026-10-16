/* ---------------------------------------------------------------------------
   rueca-notes.js — notes to the agent from ANY page (plain HTML, no build, no
   React): send tuned values or a comment into the project's .rueca/notes/,
   where the agent reads and answers them. The no-build twin of the kit's
   core/notes.ts, speaking the same format.

     <script src="rueca-notes.js"></script>
     <script>
       const snapshot = ruecaNotes.snapshot({ tool: 'sombra', values: state, defaults: DEFAULTS,
                                               labels: { angle: 'Light angle' }, t: clock.now })
       await ruecaNotes.send({ kind: 'values', snapshot })
       await ruecaNotes.send({ kind: 'comment', text: 'Shadow too hard here', anchor: { on: 'artboard', x: 0.4, y: 0.6 },
                               snapshot, image: ruecaNotes.capture(stageEl, { x: 0.4, y: 0.6 }) })
       const stop = ruecaNotes.watch((notes) => render(notes))   // the agent's replies arrive in note.replies
       await ruecaNotes.reply(note.id, 'Better. Try it smaller')   // answer it: the thread goes back to the agent
       await ruecaNotes.done(note.id)                              // only the person closes a thread

   A comment's thread: note.text first, then note.replies ({ from: 'agent' | 'person', text, at }), oldest
   first. ruecaNotes.turn(note) says whose move it is: 'agent', 'person', or null once done.
     </script>

   Where notes go: the page's own server if it has the notes route (a Vite dev
   server with ruecaNotes()), else the standalone notes server
   (scripts/notes-server.mjs, http://127.0.0.1:4388), else window.RUECA_NOTES_URL.
   ruecaNotes.endpoint() resolves to null when there's none: hide the buttons then.
--------------------------------------------------------------------------- */
(function () {
  var PATH = '/__rueca/notes'
  var found = null
  var failedAt = 0

  function probe(url) {
    return fetch(url, { headers: { accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok || r.headers.get('x-rueca-notes') !== '1') return null
        return r.json().then(function (b) { return Array.isArray(b) ? url : null })
      })
      .catch(function () { return null })
  }

  function endpoint() {
    if (found) return found
    if (Date.now() - failedAt < 5000) return Promise.resolve(null)
    var custom = window.RUECA_NOTES_URL
    found = (custom ? probe(custom) : probe(PATH).then(function (u) { return u || probe('http://127.0.0.1:4388' + PATH) }))
      .then(function (u) { if (!u) { found = null; failedAt = Date.now() } return u })
    return found
  }

  function call(query, init) {
    return endpoint().then(function (url) {
      if (!url) throw new Error('No notes server. Run scripts/notes-server.mjs, or add ruecaNotes() to the dev server.')
      return fetch(url + (query || ''), init).then(function (r) {
        return r.json().catch(function () { return null }).then(function (body) {
          if (!r.ok) { var e = new Error((body && body.error) || 'Notes server answered ' + r.status); e.status = r.status; throw e }
          return body
        })
      })
    })
  }

  var same = function (a, b) { return a === b || JSON.stringify(a) === JSON.stringify(b) }
  var humanize = function (k) { return k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, function (c) { return c.toUpperCase() }) }

  /** A format-1 snapshot from a tool's own state: what differs from the defaults, with labels and hints. */
  function snapshot(o) {
    var values = o.values || {}, defaults = o.defaults || {}, changed = {}
    Object.keys(values).forEach(function (k) {
      if (same(values[k], defaults[k])) return
      changed[k] = { value: values[k], default: defaults[k], label: (o.labels && o.labels[k]) || humanize(k) }
      if (o.hints && o.hints[k]) changed[k].hint = o.hints[k]
    })
    var s = {
      $v: 1, tool: String(o.tool || document.title || 'tool'), schema: o.schema || 1, at: new Date().toISOString(),
      url: o.url || location.href, changed: changed, values: values, steps: o.steps || [],
      view: { width: Math.round(o.width || innerWidth), height: Math.round(o.height || innerHeight),
        theme: o.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') },
    }
    if (typeof o.t === 'number' && isFinite(o.t)) s.t = Math.round(o.t)
    return s
  }

  /** A JPEG data URL of the canvases inside `el` as they sit on screen, with a ring at `anchor` (x, y as 0–1). Call it
      from the frame you just drew in: a WebGL canvas without preserveDrawingBuffer is empty after the frame ends. */
  function capture(el, anchor, maxWidth) {
    var box = el.getBoundingClientRect()
    if (!box.width || !box.height) return undefined
    var k = Math.min(1, (maxWidth || 800) / box.width)
    var out = document.createElement('canvas')
    out.width = Math.round(box.width * k); out.height = Math.round(box.height * k)
    var ctx = out.getContext('2d')
    var bg = getComputedStyle(el).backgroundColor
    ctx.fillStyle = bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg) ? bg : '#1a1a1a'
    ctx.fillRect(0, 0, out.width, out.height)
    var canvases = el.tagName === 'CANVAS' ? [el] : Array.prototype.slice.call(el.querySelectorAll('canvas'))
    canvases.forEach(function (c) {
      var r = c.getBoundingClientRect()
      try { ctx.drawImage(c, (r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k) } catch (e) { /* tainted */ }
    })
    if (anchor) {
      var x = Math.min(1, Math.max(0, anchor.x)) * out.width, y = Math.min(1, Math.max(0, anchor.y)) * out.height
      var R = Math.max(10, out.width / 40), lw = Math.max(3, out.width / 200)
      ctx.lineWidth = lw
      ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, R + lw, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke()
    }
    try { return out.toDataURL('image/jpeg', 0.85) } catch (e) { return undefined }
  }

  window.ruecaNotes = {
    endpoint: endpoint,
    snapshot: snapshot,
    capture: capture,
    /** { kind: 'values' | 'comment', text?, anchor?, snapshot, image? } → the stored note */
    send: function (note) { return call('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(note) }) },
    list: function () { return call('').then(function (b) { return Array.isArray(b) ? b : [] }) },
    /** Answer a comment; it goes back to the agent (a done one reopens). → the note */
    reply: function (id, text) { return call('?id=' + encodeURIComponent(id), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: text }) }) },
    /** Close a comment's thread, or open it again. → the note */
    done: function (id) { return call('?id=' + encodeURIComponent(id), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'done' }) }) },
    reopen: function (id) { return call('?id=' + encodeURIComponent(id), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'open' }) }) },
    /** Whose move: 'agent' (the person spoke last), 'person' (the agent did), null once done. Reads the older single
        `resolution` (status 'resolved') as the agent's answer. */
    turn: function (note) {
      if (note.status === 'done') return null
      var r = note.replies || []
      if (!r.length) return note.resolution !== undefined || note.status === 'resolved' ? 'person' : 'agent'
      var who = String(r[r.length - 1].from || '').toLowerCase()
      return who === 'person' || who === 'you' || who === 'user' ? 'agent' : 'person'
    },
    /** Clear a note; already gone counts as done. */
    remove: function (id) { return call('?id=' + encodeURIComponent(id), { method: 'DELETE' }).catch(function (e) { if (e.status === 404) return { id: id }; throw e }) },
    /** Calls fn(notes) now and whenever they change (the agent replying to one). Paused while the tab is hidden. Returns stop. */
    watch: function (fn, ms) {
      var last = '', timer = null, stopped = false
      var tick = function () {
        if (stopped) return
        var go = document.visibilityState === 'visible' ? window.ruecaNotes.list() : Promise.resolve(null)
        go.then(function (notes) { if (notes) { var key = JSON.stringify(notes); if (key !== last) { last = key; fn(notes) } } }, function () {})
          .then(function () { if (!stopped) timer = setTimeout(tick, ms || 2500) })
      }
      tick()
      return function () { stopped = true; clearTimeout(timer) }
    },
  }
})()
