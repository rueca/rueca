/* ---------------------------------------------------------------------------
   A tiny zip writer (STORE method — no compression). PNG/JPEG/WebM are
   already compressed, so deflate would buy almost nothing; what a batch
   export needs is ONE file instead of forty download prompts.

     const zip = createZip()
     await zip.addBlob('post/yuzu.png', blob)
     zip.add('manifest.json', JSON.stringify(data))
     download(zip.toBlob(), 'assets.zip')

   UTF-8 names (flag bit 11), CRC-32, DOS timestamps. ~4 GB / 65k-entry
   limits of classic zip apply; no zip64.
   (Promoted from shells/batch/local/zip.ts.)
--------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(data: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

type Bytes = Uint8Array<ArrayBuffer>

export interface ZipWriter {
  add(name: string, data: Bytes | ArrayBuffer | string): void
  addBlob(name: string, blob: Blob): Promise<void>
  /** total bytes so far (useful for progress / size readouts) */
  size(): number
  count(): number
  toBlob(): Blob
}

export function createZip(): ZipWriter {
  const enc = new TextEncoder()
  const parts: Bytes[] = []
  const central: Bytes[] = []
  let offset = 0
  let entries = 0
  const now = new Date()
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2)
  const date = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()

  const add = (name: string, input: Bytes | ArrayBuffer | string) => {
    const data: Bytes = typeof input === 'string' ? (enc.encode(input) as Bytes) : input instanceof ArrayBuffer ? new Uint8Array(input) : input
    const nameBytes = enc.encode(name) as Bytes
    const crc = crc32(data)

    const local = new Uint8Array(new ArrayBuffer(30 + nameBytes.length))
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)          // version needed
    lv.setUint16(6, 0x0800, true)      // UTF-8 names
    lv.setUint16(8, 0, true)           // STORE
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true)
    lv.setUint32(22, data.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    local.set(nameBytes, 30)

    const cd = new Uint8Array(new ArrayBuffer(46 + nameBytes.length))
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)          // made by
    cv.setUint16(6, 20, true)          // needed
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, data.length, true)
    cv.setUint32(24, data.length, true)
    cv.setUint16(28, nameBytes.length, true)
    // extra, comment, disk, internal attrs, external attrs = 0
    cv.setUint32(42, offset, true)
    cd.set(nameBytes, 46)

    parts.push(local, data)
    central.push(cd)
    offset += local.length + data.length
    entries++
  }

  return {
    add,
    addBlob: async (name, blob) => add(name, new Uint8Array(await blob.arrayBuffer())),
    size: () => offset,
    count: () => entries,
    toBlob: () => {
      const cdSize = central.reduce((n, c) => n + c.length, 0)
      const end = new Uint8Array(new ArrayBuffer(22))
      const ev = new DataView(end.buffer)
      ev.setUint32(0, 0x06054b50, true)
      ev.setUint16(8, entries, true)
      ev.setUint16(10, entries, true)
      ev.setUint32(12, cdSize, true)
      ev.setUint32(16, offset, true)
      return new Blob([...parts, ...central, end], { type: 'application/zip' })
    },
  }
}

/** canvas.toBlob as a promise. */
export const canvasBlob = (c: HTMLCanvasElement, type = 'image/png', quality?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Canvas export failed'))), type, quality))

/** Human-readable bytes: 1.4 MB. */
export const fmtBytes = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 ** 2).toFixed(1)} MB`)
