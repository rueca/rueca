// Latin-subset woff2 bytes per family spec, as Chrome would download them.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const specs = {
  'Recursive (wght,CASL,MONO)': 'Recursive:wght,CASL,MONO@300..900,0..1,0..1',
  'Recursive (wght,CASL)': 'Recursive:wght,CASL@300..900,0..1',
  'Fraunces (opsz,wght,SOFT)': 'Fraunces:opsz,wght,SOFT@9..144,400..800,0..100',
  'Archivo (wdth 100-125)': 'Archivo:wdth,wght@100..125,400..800',
  'Bricolage (opsz,wght)': 'Bricolage+Grotesque:opsz,wght@12..96,400..800',
  'Fredoka (wght)': 'Fredoka:wght@400..700',
  'Inter (wght)': 'Inter:wght@400..700',
}
for (const [name, spec] of Object.entries(specs)) {
  const res = await fetch(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`, { headers: { 'user-agent': UA } })
  const css = await res.text()
  // the latin block is the one whose unicode-range starts with U+0000-00FF
  const blocks = css.split('@font-face').filter((b) => /U\+0000-00FF/.test(b))
  let bytes = 0
  for (const b of blocks) {
    const url = b.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (url) { const h = await fetch(url, { method: 'HEAD' }); bytes += +h.headers.get('content-length') }
  }
  console.log(`${name.padEnd(20)} css ${res.status}  latin files ${blocks.length}  ${(bytes / 1024).toFixed(0)} KB`)
}
