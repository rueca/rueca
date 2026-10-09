/* Worker entry: the node engine cooks off the main thread so dragging a slider never janks the UI. */
import { createHost, type Request, type Response } from './runner'

const scope = self as unknown as { postMessage(m: Response, t?: Transferable[]): void; onmessage: ((e: MessageEvent<Request>) => void) | null }
const handle = createHost((m, t) => scope.postMessage(m, t ?? []))
scope.onmessage = (e) => { void handle(e.data) }
