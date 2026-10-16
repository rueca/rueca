/* Thumbnail URLs, versioned by content. The files in public/thumbs keep fixed names, and the host caches them
   (vercel.json: a day, then a week stale-while-revalidate), so after a deploy a browser could show an old
   picture beside a new tracing, or an old picture under a new live shell. vite.config hashes every file under
   public/thumbs at build time (__THUMB_VERSIONS__) and each URL carries its file's hash: a changed picture is a
   new URL, an unchanged one stays cached. */
declare const __THUMB_VERSIONS__: Record<string, string> | undefined
const V: Record<string, string> = typeof __THUMB_VERSIONS__ !== 'undefined' ? __THUMB_VERSIONS__ : {}

/** `path` is relative to public/, e.g. `thumbs/rail/motion-dark.jpg` */
export const thumbUrl = (path: string) => `${import.meta.env.BASE_URL}${path}${V[path] ? `?v=${V[path]}` : ''}`
