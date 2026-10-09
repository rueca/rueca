/* 16-bit PCM WAV encoder (interleaved), with TPDF dither. No dependencies. */
export function encodeWAV(channels: Float32Array[], sampleRate: number): Blob {
  const n = channels[0].length, ch = channels.length
  const bytes = 44 + n * ch * 2
  const buf = new ArrayBuffer(bytes)
  const dv = new DataView(buf)
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); dv.setUint32(4, bytes - 8, true); str(8, 'WAVE')
  str(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, ch, true)
  dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true)
  str(36, 'data'); dv.setUint32(40, n * ch * 2, true)
  let o = 44
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const dither = (Math.random() - Math.random()) / 32768
      const x = Math.max(-1, Math.min(1, channels[c][i] + dither))
      dv.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true)
      o += 2
    }
  return new Blob([buf], { type: 'audio/wav' })
}
