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
                               snapshot, image: ruecaNotes.capture(stageEl, { x: 0.4, y: 0.6 }) })   // send waits for it
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

  // The DOM and inline SVG part of a thumbnail, as the kit's snapshotElement does it: a clone with every computed
  // style written inline (diffed against a blank iframe's defaults to keep it small), inside an SVG <foreignObject>,
  // loaded as an image. Canvases, images, video and iframes keep their boxes here but are drawn separately.
  var SVG_NS = 'http://www.w3.org/2000/svg'
  var blankFrame = null, defaultsByTag = {}
  function defaultStyle(node) {
    var key = node.namespaceURI + '|' + node.localName
    if (defaultsByTag[key]) return defaultsByTag[key]
    if (!blankFrame) {
      blankFrame = document.createElement('iframe')
      blankFrame.setAttribute('aria-hidden', 'true')
      blankFrame.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;visibility:hidden;border:0'
      document.body.appendChild(blankFrame)
    }
    var d = blankFrame.contentDocument
    var probe = node.namespaceURI === SVG_NS ? d.createElementNS(SVG_NS, node.localName) : d.createElement(node.localName)
    var host = probe
    if (node.namespaceURI === SVG_NS && node.localName !== 'svg') { host = d.createElementNS(SVG_NS, 'svg'); host.appendChild(probe) }
    d.body.appendChild(host)
    var cs = blankFrame.contentWindow.getComputedStyle(probe), map = {}
    for (var i = 0; i < cs.length; i++) map[cs[i]] = cs.getPropertyValue(cs[i])
    host.remove()
    return (defaultsByTag[key] = map)
  }
  function styledClone(node, parentStyle) {
    if (node.nodeType === 3) return node.cloneNode()
    if (node.nodeType !== 1 || node.localName === 'script' || node.localName === 'style') return null
    var cs = getComputedStyle(node)
    if (cs.display === 'none') return null
    var copy = node.cloneNode(false), def = defaultStyle(node), out = []
    for (var i = 0; i < cs.length; i++) {
      var p = cs[i]
      if (p.lastIndexOf('--', 0) === 0) continue
      var v = cs.getPropertyValue(p)
      // border widths always: a 0px width equals the default, but would fall back to `medium` beside a set style
      if (def[p] !== v || (parentStyle && parentStyle.getPropertyValue(p) !== v) || /^border-\w+-width$/.test(p)) out.push(p + ':' + v)
    }
    if (/^(canvas|img|video|iframe)$/.test(node.localName)) { out.push('visibility:hidden'); copy.setAttribute('style', out.join(';')); return copy }
    copy.setAttribute('style', out.join(';'))
    if (node.localName === 'input' || node.localName === 'textarea') copy.setAttribute('value', node.value)
    for (var c = node.firstChild; c; c = c.nextSibling) { var k = styledClone(c, cs); if (k) copy.appendChild(k) }
    return copy
  }
  function drawDom(el, w, h) {
    var wrap = document.createElement('div')
    wrap.setAttribute('style', 'width:' + w + 'px;height:' + h + 'px;position:relative;overflow:hidden')
    var clone = styledClone(el, getComputedStyle(el.parentElement || document.body))
    if (!clone) return Promise.resolve(null)
    // the element's own place on the page (fixed, offset, zoomed by a stage) isn't part of the picture
    // (appended last, so it beats the logical inset-* and margin-* copies of the same values)
    clone.setAttribute('style', clone.getAttribute('style') + ';position:relative;inset:0 auto auto 0;margin:0;transform:none')
    wrap.appendChild(clone)
    var svg = '<svg xmlns="' + SVG_NS + '" width="' + w + '" height="' + h + '"><foreignObject x="0" y="0" width="100%" height="100%">' +
      new XMLSerializer().serializeToString(wrap) + '</foreignObject></svg>'
    var img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    return img.decode().then(function () {
      var c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      c.getContext('2d').getImageData(0, 0, 1, 1)   // throws where the browser taints foreignObject: leave the DOM out then
      return c
    }).catch(function () { return null })
  }

  /** A promise of a JPEG data URL of `el` as it sits on screen: its DOM and inline SVG, then its canvases and
      images where they are, with a ring at `anchor` (x, y as 0–1). Canvases are copied at once, so call it from
      the frame you just drew in: a WebGL canvas without preserveDrawingBuffer is empty after the frame ends.
      Text in the thumbnail uses a system face. Resolves undefined when there's nothing to draw. */
  function capture(el, anchor, maxWidth) {
    var box = el.getBoundingClientRect()
    if (!box.width || !box.height) return Promise.resolve(undefined)
    var k = Math.min(1, (maxWidth || 800) / box.width)
    var place = function (node) {
      var r = node.getBoundingClientRect()
      return [(r.left - box.left) * k, (r.top - box.top) * k, r.width * k, r.height * k]
    }
    // canvases now, while their pixels are there; images can wait
    var media = (el.tagName === 'CANVAS' ? [el] : Array.prototype.slice.call(el.querySelectorAll('canvas, img'))).map(function (n) {
      if (n.tagName === 'IMG') return { src: n, at: place(n) }
      if (!n.width || !n.height) return null
      var copy = document.createElement('canvas')
      copy.width = n.width; copy.height = n.height
      try { copy.getContext('2d').drawImage(n, 0, 0) } catch (e) { return null }   // tainted
      return { src: copy, at: place(n) }
    }).filter(Boolean)
    var dom = el.tagName === 'CANVAS' ? Promise.resolve(null) : drawDom(el, Math.round(el.offsetWidth || box.width), Math.round(el.offsetHeight || box.height))
    return dom.then(function (domCanvas) {
      var out = document.createElement('canvas')
      out.width = Math.round(box.width * k); out.height = Math.round(box.height * k)
      var ctx = out.getContext('2d')
      var bg = getComputedStyle(el).backgroundColor
      ctx.fillStyle = bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg) ? bg : '#1a1a1a'
      ctx.fillRect(0, 0, out.width, out.height)
      if (domCanvas) ctx.drawImage(domCanvas, 0, 0, out.width, out.height)
      media.forEach(function (m) {
        if (m.src.tagName === 'IMG' && !(m.src.complete && m.src.naturalWidth)) return
        try { ctx.drawImage(m.src, m.at[0], m.at[1], m.at[2], m.at[3]) } catch (e) { /* tainted or broken */ }
      })
      if (anchor) {
        var x = Math.min(1, Math.max(0, anchor.x)) * out.width, y = Math.min(1, Math.max(0, anchor.y)) * out.height
        var R = Math.max(10, out.width / 40), lw = Math.max(3, out.width / 200)
        ctx.lineWidth = lw
        ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, R + lw, 0, Math.PI * 2); ctx.stroke()
        ctx.strokeStyle = '#ff3b30'; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke()
      }
      try { return out.toDataURL('image/jpeg', 0.85) } catch (e) { return undefined }
    })
  }

  window.ruecaNotes = {
    endpoint: endpoint,
    snapshot: snapshot,
    capture: capture,
    /** { kind: 'values' | 'comment', text?, anchor?, snapshot, image? } → the stored note. `image` may be capture()'s promise. */
    send: function (note) {
      return Promise.resolve(note.image).then(function (image) {
        var body = JSON.stringify(Object.assign({}, note, { image: image }))
        return call('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body })
      })
    },
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
