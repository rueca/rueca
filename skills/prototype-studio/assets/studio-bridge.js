/* ---------------------------------------------------------------------------
   studio-bridge.js — drop this into ANY prototype (plain HTML, Svelte, Vue,
   Webflow export, a p5 sketch) to let a studio harness drive it.

     <script src="studio-bridge.js"></script>
     <script>
       studio.on((values) => { … apply … })        // every change
       studio.cssVars()                             // or: mirror values to CSS custom properties
       studio.set('headline', 'New copy')           // push a value back to the harness
     </script>

   No dependencies, no build step. Talks to the parent via postMessage:
     parent → frame  { type: 'studio:params', values }
     frame  → parent { type: 'studio:ready' } · { type: 'studio:set', key, value }
--------------------------------------------------------------------------- */
(function () {
  var listeners = []
  var last = null
  var toVar = function (k) { return '--' + k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() }
  var unit = { px: 1 }
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'studio:params') return
    last = e.data.values
    listeners.forEach(function (fn) { try { fn(last) } catch (err) { console.error(err) } })
  })
  window.studio = {
    on: function (fn) { listeners.push(fn); if (last) fn(last); return function () { listeners = listeners.filter(function (f) { return f !== fn }) } },
    set: function (key, value) { parent.postMessage({ type: 'studio:set', key: key, value: value }, '*') },
    values: function () { return last },
    /** Mirror every scalar value to a CSS custom property on :root. Numbers get `suffix` (default px) unless listed in `unitless`. */
    cssVars: function (opts) {
      opts = opts || {}
      var unitless = opts.unitless || []
      return this.on(function (v) {
        var s = document.documentElement.style
        Object.keys(v).forEach(function (k) {
          var val = v[k]
          if (typeof val === 'number') s.setProperty(toVar(k), unitless.indexOf(k) >= 0 ? String(val) : val + (opts.suffix || 'px'))
          else if (typeof val === 'string' || typeof val === 'boolean') s.setProperty(toVar(k), String(val))
        })
      })
    },
  }
  void unit
  if (parent !== window) parent.postMessage({ type: 'studio:ready' }, '*')
})()
