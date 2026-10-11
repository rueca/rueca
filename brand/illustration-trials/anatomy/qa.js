/* QA probe for the kit drawings, run in a browser on any trial page served from this folder:
     const { measure } = await import('./qa.js'); await measure(['controls', 'layout'])
   For each drawing, at rest and apart: the drawn outline (sheet units, pen marks excluded),
   its centre and size, and any pen mark that runs over a part (a plate doesn't count: marks are
   written on it) or a note past the 6% margin. */
export async function measure(names) {
  const out = {};
  for (const n of names) {
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:900px;height:900px;border:0;z-index:9;background:#fff';
    f.src = `${n}-light.html?${Date.now()}`;
    document.body.appendChild(f);
    await new Promise((r) => (f.onload = r));
    await new Promise((r) => setTimeout(r, 700));
    const d = f.contentDocument;
    d.body.style.zoom = 1;
    const st = d.createElement('style');
    st.textContent = '*{transition:none!important}';
    d.head.appendChild(st);
    const svg = d.querySelector('svg');
    svg.style.width = '600px';
    svg.style.height = '600px';
    await new Promise((r) => setTimeout(r, 150));
    const inv = svg.getScreenCTM().inverse();
    const toVB = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(inv); return [p.x, p.y]; };
    const isPen = (e) => e.closest('.rueca-pen, .rueca-note');
    const partAt = (x, y, not) => d.elementsFromPoint(x, y).find((e) => e !== not && e.closest('svg') === svg && !isPen(e) && !e.closest('.rueca-plate') && e.tagName !== 'svg' && getComputedStyle(e).fill !== 'none');
    const pass = () => {
      let a = [1e9, 1e9, -1e9, -1e9];
      for (const e of svg.querySelectorAll('path, circle, text')) {
        if (isPen(e) || e.closest('defs')) continue;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        const [x0, y0] = toVB(r.left, r.top), [x1, y1] = toVB(r.right, r.bottom);
        a = [Math.min(a[0], x0), Math.min(a[1], y0), Math.max(a[2], x1), Math.max(a[3], y1)];
      }
      const notes = [];
      svg.querySelectorAll('.rueca-pen').forEach((p, i) => {
        const L = p.getTotalLength(), m = p.getScreenCTM(), on = [];
        for (let s = 0; s < L; s += 3) { const q = p.getPointAtLength(s).matrixTransform(m); on.push(partAt(q.x, q.y, p) ? 1 : 0); }
        const first = on.indexOf(1);
        if (first >= 0) notes.push(`pen ${i}: on parts from ${Math.round((100 * first) / on.length)}% along, ${Math.round((100 * on.reduce((x, y) => x + y, 0)) / on.length)}% of its length`);
      });
      for (const t of svg.querySelectorAll('.rueca-note')) {
        const r = t.getBoundingClientRect();
        let hit = null;
        for (let i = 0; i <= 12 && !hit; i++) for (let j = 1; j <= 3 && !hit; j++) {
          const x = r.left + (r.width * i) / 12, y = r.top + (r.height * j) / 4;
          if (partAt(x, y)) hit = toVB(x, y).map((v) => Math.round(v));
        }
        if (hit) notes.push(`note "${t.textContent}" over a part at ${hit}`);
        const [x0] = toVB(r.left, r.top), [x1] = toVB(r.right, r.bottom);
        if (x0 < 36 || x1 > 564) notes.push(`note "${t.textContent}" past the margin`);
      }
      return { box: a.map(Math.round), centre: [Math.round((a[0] + a[2]) / 2), Math.round((a[1] + a[3]) / 2)], size: [Math.round(a[2] - a[0]), Math.round(a[3] - a[1])], notes };
    };
    const rest = pass();
    d.querySelector('.iso-stage').style.setProperty('--kh', '1');
    await new Promise((r) => setTimeout(r, 120));
    out[n] = { rest, apart: pass() };
    f.remove();
  }
  return out;
}
